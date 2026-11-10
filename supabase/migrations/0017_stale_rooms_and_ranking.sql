alter table ll_rooms
  add column if not exists started_at timestamptz;

alter table ll_matches
  add column if not exists closed_by text not null default 'target';

update ll_rooms set started_at = created_at where started_at is null and status = 'playing';

create index if not exists ll_rooms_started_idx on ll_rooms(status, started_at);
