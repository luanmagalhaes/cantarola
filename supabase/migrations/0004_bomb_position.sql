alter table ll_turns add column if not exists bomb_position int;

update ll_turns t
set bomb_position = ts.position
from ll_turn_songs ts
where ts.turn_id = t.id
  and ts.song_id = t.bomb_song_id
  and t.bomb_song_id is not null
  and t.bomb_position is null;
