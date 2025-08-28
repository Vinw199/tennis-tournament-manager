-- step 1: drop the old, overly broad "for all" policy.
-- this policy was causing a conflict because its "with check" clause was
-- incorrectly being applied to insert operations, blocking new space creation.
drop policy "Admins can manage spaces they belong to" on public.spaces;


-- step 2: create a specific policy for update actions.
-- this restricts updates to space admins.
create policy "Admins can update their spaces"
on public.spaces for update
using (id in (select get_user_admin_spaces()))
with check (id in (select get_user_admin_spaces()));


-- step 3: create a specific policy for delete actions.
-- this restricts deletes to space admins.
create policy "Admins can delete their spaces"
on public.spaces for delete
using (id in (select get_user_admin_spaces()));