create table if not exists ll_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references ll_rooms(id) on delete cascade,
  player_id uuid references ll_players(id) on delete set null,
  author_name text not null,
  kind text not null default 'text',
  body text,
  audio_url text,
  audio_seconds smallint,
  created_at timestamptz not null default now()
);

alter table ll_messages
  add constraint ll_messages_kind_check check (kind in ('text', 'audio'));

create index if not exists ll_messages_room_idx
  on ll_messages(room_id, created_at desc);

alter table ll_messages enable row level security;

create table if not exists ll_take_reactions (
  take_id uuid not null references ll_takes(id) on delete cascade,
  player_id uuid not null references ll_players(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (take_id, player_id)
);

create index if not exists ll_take_reactions_take_idx
  on ll_take_reactions(take_id);

alter table ll_take_reactions enable row level security;
