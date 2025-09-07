create or replace view public.profiles as
    select id, raw_user_meta_data->>'display_name' as display_name
    from auth.users;