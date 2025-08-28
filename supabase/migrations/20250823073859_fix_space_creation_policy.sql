-- In a new migration
drop policy if exists "Authenticated users can create spaces" on public.spaces;
create policy "Users can create spaces"
on public.spaces for insert
with check (auth.uid() is not null and created_by = auth.uid());