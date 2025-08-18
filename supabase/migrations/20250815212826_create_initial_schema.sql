create extension if not exists "pgcrypto" with schema "extensions";

-- Create the spaces table
create table spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) not null
);

-- Create the space_members junction table
create table space_members (
  space_id uuid references spaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null,
  primary key (space_id, user_id)
);

-- Create the players table (Club Roster) with soft delete
create table players (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade not null,
  name text not null,
  default_skill_rank integer not null,
  age integer,
  gender text,
  profile_picture_url text,
  is_active boolean default true not null -- This is the change
);

-- Create the tournaments table
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade not null,
  date date not null,
  name text not null,
  status text not null default 'planning' check (status in ('planning','active','completed')),
  entry_fee numeric(10,2),
  prize_money_details text,
  settings jsonb default '{}'::jsonb
);

-- Create the entries table
create table entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade not null,
  name text not null
);

-- Create the entry_players junction table
create table entry_players (
  entry_id uuid references entries(id) on delete cascade not null, -- Cascade here is OK
  player_id uuid references players(id) not null,
  skill_rank_for_tournament integer not null,
  primary key (entry_id, player_id)
);

-- Create the matches table
create table matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade not null,
  round text not null,
  entry1_id uuid references entries(id) on delete cascade not null,
  entry2_id uuid references entries(id) on delete cascade not null,
  entry1_score integer,
  entry2_score integer,
  status text not null default 'pending' check (status in ('pending','completed')),
  
  -- Add logical constraints
  check (entry1_id <> entry2_id),
  check (entry1_score >= 0 and entry2_score >= 0)
);

-- Create the wizard_drafts table
create table wizard_drafts (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  updated_at timestamptz not null default now(),
  data jsonb,
  unique (space_id, user_id)
);