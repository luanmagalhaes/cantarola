create table if not exists ll_song_lyrics (
  song_id text primary key,
  lyrics text,
  fetched_at timestamptz not null default now()
);

alter table ll_song_lyrics enable row level security;
