create table if not exists ll_song_plays (
  song_id text primary key,
  played_at timestamptz not null default now()
);

alter table ll_song_plays enable row level security;
