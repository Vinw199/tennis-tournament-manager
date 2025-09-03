-- This migration adds a policy to allow the creator of a space to select their own spaces.
-- This is necessary because at the moment of creation, the creator is not yet a member of the space.
-- Solve the syntax error in this file

create policy "Creators can select their own spaces"
on public.spaces for select
using (created_by = auth.uid());