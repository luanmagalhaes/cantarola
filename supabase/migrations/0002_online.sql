alter table ll_rooms add column if not exists play_mode text not null default 'local';

create table if not exists ll_takes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references ll_rooms(id) on delete cascade,
  turn_id uuid not null references ll_turns(id) on delete cascade,
  song_id text not null,
  audio_url text not null,
  seconds int not null default 0,
  solved_by uuid references ll_players(id) on delete set null,
  solved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ll_guesses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references ll_rooms(id) on delete cascade,
  turn_id uuid not null references ll_turns(id) on delete cascade,
  take_id uuid not null references ll_takes(id) on delete cascade,
  player_id uuid not null references ll_players(id) on delete cascade,
  body text not null,
  correct boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ll_takes_turn_idx on ll_takes(turn_id, created_at);
create index if not exists ll_guesses_take_idx on ll_guesses(take_id, created_at desc);

alter table ll_takes enable row level security;
alter table ll_guesses enable row level security;

insert into storage.buckets (id, name, public)
values ('ll-audio', 'll-audio', true)
on conflict (id) do update set public = true;
