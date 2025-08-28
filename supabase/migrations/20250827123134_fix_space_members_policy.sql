-- step 1: drop the old, overly broad "for all" policy on space_members.
drop policy "Admins can manage members in their space" on public.space_members;


-- step 2: create a specific insert policy.
-- this allows a user to be inserted into a space if they are the one who created it.
-- this is the key rule that allows the 'on_space_created' trigger to succeed.
create policy "Users can add themselves to spaces they created"
on public.space_members for insert
with check (
  user_id = auth.uid() and
  space_id in (select id from spaces where created_by = auth.uid())
);


-- step 3: create a policy for updates.
-- this allows existing admins to change member roles.
create policy "Admins can update members in their space"
on public.space_members for update
using (space_id in (select get_user_admin_spaces()))
with check (space_id in (select get_user_admin_spaces()));


-- step 4: create a policy for deletes.
-- this allows existing admins to remove members.
create policy "Admins can delete members from their space"
on public.space_members for delete
using (space_id in (select get_user_admin_spaces()));