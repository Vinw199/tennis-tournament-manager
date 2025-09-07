-- This function securely handles the acceptance of a player invitation.
-- It's designed to be called from a trusted server-side environment (like a Next.js server action).
-- It validates the invitation and then performs three database operations in a single transaction.

create or replace function public.accept_invite_transaction(
    p_invite_token text,
    p_user_id uuid,
    p_user_email text
)
returns void
language plpgsql
security definer -- IMPORTANT: Allows the function to bypass RLS to perform its specific tasks.
as $$
declare
    v_invite "public"."invites";
    v_player "public"."players";
    v_already_member boolean;
begin
    -- Step 1: Fetch the invitation details using the provided token.
    -- Lock the row for update to prevent race conditions.
    select * into v_invite from public.invites where token = p_invite_token for update;

    -- Step 2: Perform validation checks. If any of these fail, the function will
    -- raise an error and the entire transaction will be rolled back automatically.

    if not found then
        raise exception 'Invitation not found. The link may be invalid.';
    end if;

    if v_invite.status <> 'pending' then
        raise exception 'This invitation has already been %.', v_invite.status;
    end if;

    if v_invite.expires_at < now() then
        -- Optional: As a good practice, you could also update the status to 'expired' here.
        raise exception 'This invitation has expired.';
    end if;
    
    -- Security Check: Ensure the logged-in user's email matches the invited email.
    if v_invite.invitee_email <> p_user_email then
      raise exception 'Email mismatch. You must be logged in with the email address the invitation was sent to.';
    end if;

    -- Step 3: Fetch the associated player profile to perform further checks.
    select * into v_player from public.players where id = v_invite.player_id;
    
    if v_player.user_id is not null then
      raise exception 'This player profile has already been claimed by another user.';
    end if;

    -- Step 4: Check if the user is already a member of the space.
    select exists (
      select 1 from public.space_members 
      where space_id = v_invite.space_id and user_id = p_user_id
    ) into v_already_member;

    if v_already_member then
      raise exception 'You are already a member of this club.';
    end if;

    -- Step 5: All checks have passed. Perform the database modifications.
    -- These three operations will either all succeed or all fail together.

    -- a) Link the player profile to the authenticated user.
    update public.players
    set user_id = p_user_id
    where id = v_invite.player_id;

    -- b) Add the user to the space as a 'member'.
    insert into public.space_members(space_id, user_id, role)
    values(v_invite.space_id, p_user_id, 'member');

    -- c) Mark the invitation as 'accepted'.
    update public.invites
    set status = 'accepted'
    where id = v_invite.id;

end;
$$;
