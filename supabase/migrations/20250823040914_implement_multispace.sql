-- Step 1: Add a new RLS policy to allow any authenticated user to create a space.
-- The `with check` clause ensures that the user creating the space is correctly
-- assigned as the `created_by` user.
create policy "Authenticated users can create spaces"
on public.spaces for insert
to authenticated
with check (created_by = auth.uid());


-- Step 2: Create a trigger function that will run after a new space is inserted.
-- This function takes the newly created space's ID and its creator's ID
-- and adds the creator to the space_members table with an 'admin' role.
create or replace function public.handle_new_space_creation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.space_members (space_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;


-- Step 3: Create the trigger itself.
-- This tells the database to run the `handle_new_space_creation` function
-- automatically after every new row is inserted into the `spaces` table.
create trigger on_space_created
  after insert on public.spaces
  for each row execute procedure public.handle_new_space_creation();
