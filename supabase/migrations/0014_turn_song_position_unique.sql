with ranked as (
  select
    turn_id,
    song_id,
    row_number() over (
      partition by turn_id, position
      order by song_id
    ) as place
  from ll_turn_songs
)
delete from ll_turn_songs
using ranked
where ll_turn_songs.turn_id = ranked.turn_id
  and ll_turn_songs.song_id = ranked.song_id
  and ranked.place > 1;

create unique index if not exists ll_turn_songs_turn_position_idx
  on ll_turn_songs(turn_id, position);
