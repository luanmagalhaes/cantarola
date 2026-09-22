create table if not exists ll_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid,
  deck_mode text not null default 'mixed',
  turn_seconds int not null default 45,
  steal_enabled boolean not null default true,
  twists jsonb not null default '[]'::jsonb,
  status text not null default 'lobby',
  current_turn_id uuid,
  round_number int not null default 0,
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ll_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references ll_rooms(id) on delete cascade,
  name text not null,
  team text,
  is_host boolean not null default false,
  spoke_count int not null default 0,
  seat int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists ll_player_secrets (
  player_id uuid primary key references ll_players(id) on delete cascade,
  secret text not null
);

create table if not exists ll_turns (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references ll_rooms(id) on delete cascade,
  singer_id uuid not null references ll_players(id) on delete cascade,
  team text not null,
  status text not null default 'ready',
  twist text,
  bomb_song_id text,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ll_turn_songs (
  turn_id uuid not null references ll_turns(id) on delete cascade,
  song_id text not null,
  position int not null,
  outcome text,
  primary key (turn_id, song_id)
);

create table if not exists ll_draw_pile (
  room_id uuid not null references ll_rooms(id) on delete cascade,
  song_id text not null,
  position int not null,
  primary key (room_id, song_id)
);

create table if not exists ll_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references ll_rooms(id) on delete cascade,
  turn_id uuid not null references ll_turns(id) on delete cascade,
  song_id text not null,
  outcome text not null,
  scoring_team text,
  points int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists ll_matches (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  deck_mode text not null,
  score_red int not null,
  score_blue int not null,
  winner text,
  players jsonb not null default '[]'::jsonb,
  songs_played int not null default 0,
  finished_at timestamptz not null default now()
);

create index if not exists ll_players_room_idx on ll_players(room_id, seat);
create index if not exists ll_turns_room_idx on ll_turns(room_id, created_at desc);
create index if not exists ll_results_room_idx on ll_results(room_id, created_at desc);
create index if not exists ll_draw_pile_room_idx on ll_draw_pile(room_id, position);
create index if not exists ll_matches_finished_idx on ll_matches(finished_at desc);

alter table ll_rooms enable row level security;
alter table ll_players enable row level security;
alter table ll_player_secrets enable row level security;
alter table ll_turns enable row level security;
alter table ll_turn_songs enable row level security;
alter table ll_draw_pile enable row level security;
alter table ll_results enable row level security;
alter table ll_matches enable row level security;

drop policy if exists ll_rooms_public_read on ll_rooms;
create policy ll_rooms_public_read on ll_rooms for select to anon, authenticated using (true);

drop policy if exists ll_players_public_read on ll_players;
create policy ll_players_public_read on ll_players for select to anon, authenticated using (true);

drop policy if exists ll_turns_public_read on ll_turns;
create policy ll_turns_public_read on ll_turns for select to anon, authenticated using (true);

drop policy if exists ll_results_public_read on ll_results;
create policy ll_results_public_read on ll_results for select to anon, authenticated using (true);

drop policy if exists ll_matches_public_read on ll_matches;
create policy ll_matches_public_read on ll_matches for select to anon, authenticated using (true);

alter publication supabase_realtime add table ll_rooms;
alter publication supabase_realtime add table ll_players;
alter publication supabase_realtime add table ll_turns;
alter publication supabase_realtime add table ll_results;

create or replace function ll_generate_code()
returns text
language plpgsql
as $$
declare
  candidate text;
  attempt integer := 0;
begin
  delete from ll_rooms where created_at < now() - interval '24 hours';

  loop
    candidate := lpad((10 + floor(random() * 90))::int::text, 2, '0');

    exit when not exists (select 1 from ll_rooms where code = candidate);

    attempt := attempt + 1;

    if attempt > 80 then
      raise exception 'todas as salas estao ocupadas agora';
    end if;
  end loop;

  return candidate;
end;
$$;
