-- Add indexes for common query patterns
create index on players (space_id);
create index on tournaments (space_id, status);
create index on entries (tournament_id);
create index on entry_players (entry_id);
create index on matches (tournament_id, round);