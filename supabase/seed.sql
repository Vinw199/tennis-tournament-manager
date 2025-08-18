-- Dev seed helper for local development
-- Usage (run after signing in locally as the user who should own the data):
--   select dev_seed(default, 'Jorhat Sunday Socials');
--   -- returns the space_id; set NEXT_PUBLIC_SPACE_ID to this value for the app

create or replace function dev_seed(
  p_space_id uuid default null,
  p_space_name text default 'Jorhat Sunday Socials'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
begin
  -- Use provided space_id or generate one
  if p_space_id is null then
    sid := gen_random_uuid();
  else
    sid := p_space_id;
  end if;

  -- Create space owned by the current user
  insert into spaces (id, name, created_by)
  values (sid, p_space_name, auth.uid())
  on conflict (id) do nothing;

  -- Ensure caller is an admin member of the space
  insert into space_members (space_id, user_id, role)
  values (sid, auth.uid(), 'admin')
  on conflict (space_id, user_id) do nothing;

  -- Seed ~20 players
  insert into players (space_id, name, default_skill_rank, age, gender, profile_picture_url)
  values
    (sid, 'Anita Sharma', 7, 29, 'F', null),
    (sid, 'Rohit Das', 8, 31, 'M', null),
    (sid, 'Meera Gupta', 6, 26, 'F', null),
    (sid, 'Arjun Singh', 9, 33, 'M', null),
    (sid, 'Priya Patel', 5, 24, 'F', null),
    (sid, 'Vikram Rao', 7, 30, 'M', null),
    (sid, 'Karan Mehta', 6, 28, 'M', null),
    (sid, 'Neha Kapoor', 8, 32, 'F', null),
    (sid, 'Ayesha Khan', 5, 23, 'F', null),
    (sid, 'Sanjay Verma', 7, 29, 'M', null),
    (sid, 'Ishita Bose', 6, 27, 'F', null),
    (sid, 'Dev Malhotra', 8, 35, 'M', null),
    (sid, 'Ritika Jain', 7, 30, 'F', null),
    (sid, 'Nikhil Roy', 6, 26, 'M', null),
    (sid, 'Tanya Gill', 5, 22, 'F', null),
    (sid, 'Aman Tiwari', 7, 31, 'M', null),
    (sid, 'Seema Nair', 6, 28, 'F', null),
    (sid, 'Yash Agarwal', 8, 34, 'M', null),
    (sid, 'Pooja Reddy', 5, 25, 'F', null),
    (sid, 'Kabir Bhatia', 7, 29, 'M', null)
  on conflict do nothing;

  return sid;
end;
$$;

-- Allow authenticated users to execute the seed helper
grant execute on function dev_seed(uuid, text) to authenticated;


