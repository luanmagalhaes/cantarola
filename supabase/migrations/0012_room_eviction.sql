create or replace function ll_free_slots(keep int default 8)
returns int
language plpgsql
as $$
declare
  livres int;
  faltam int;
begin
  delete from ll_rooms
  where status = 'done' and updated_at < now() - interval '1 hour';

  delete from ll_rooms
  where status = 'lobby' and updated_at < now() - interval '30 minutes';

  delete from ll_rooms
  where updated_at < now() - interval '12 hours';

  select 100 - count(distinct code) into livres from ll_rooms;

  if livres >= keep then
    return livres;
  end if;

  faltam := keep - livres;

  delete from ll_rooms
  where id in (
    select id from ll_rooms
    where updated_at < now() - interval '30 minutes'
    order by updated_at asc
    limit faltam
  );

  select 100 - count(distinct code) into livres from ll_rooms;

  return livres;
end;
$$;
