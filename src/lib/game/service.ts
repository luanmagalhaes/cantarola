import { randomUUID } from "node:crypto";
import { randomFace } from "@/data/faces";
import { ServiceError, messageFor } from "@/lib/messages";
import { serverClient } from "@/lib/supabase/server";
import { songById, songsFor } from "@/data/songs";
import {
  assignTeams,
  canStart,
  isGameOver,
  nextTurn,
  pickTwist,
  pointsFor,
  scoreFrom,
  scoringTeamFor,
  shuffle,
  isOneOnOne,
  songsPerTurn,
  winnerOf,
} from "@/lib/game/rules";
import type {
  DeckMode,
  Outcome,
  PlayerRow,
  ResultRow,
  RoomRow,
  Song,
  Team,
  TurnRow,
  TurnSongRow,
  TurnStatus,
  Twist,
} from "@/types/game";

export type PlayMode = "local" | "online";

const localSeconds = 60;
const onlineSeconds = 90;
const answerSeconds = 60;

function fail(status: number): never {
  throw new ServiceError(status, messageFor(status));
}

async function freeCode(): Promise<string> {
  await serverClient().rpc("ll_free_slots", { keep: 8 });

  const { data, error } = await serverClient().rpc("ll_generate_code");

  if (error || typeof data !== "string") {
    throw new ServiceError(
      503,
      "Todas as salas estão ocupadas agora. Tente de novo em um minuto.",
    );
  }

  return data;
}

async function createSecret(playerId: string): Promise<string> {
  const secret = randomUUID();

  await serverClient()
    .from("ll_player_secrets")
    .insert({ player_id: playerId, secret });

  return secret;
}

export async function createRoom(input: {
  name: string;
  deckMode: DeckMode;
  playMode: PlayMode;
  isTest: boolean;
}) {
  const name = input.name.trim();

  if (name.length < 2) {
    fail(400);
  }

  if (
    !deckModes.includes(input.deckMode) ||
    !["local", "online"].includes(input.playMode)
  ) {
    fail(400);
  }

  const code = await freeCode();

  const { data: room } = await serverClient()
    .from("ll_rooms")
    .insert({
      code,
      deck_mode: input.deckMode,
      play_mode: input.playMode,
      turn_seconds: input.playMode === "online" ? onlineSeconds : localSeconds,
      is_test: input.isTest,
    })
    .select("*")
    .single();

  if (!room) {
    fail(500);
  }

  const { data: player } = await serverClient()
    .from("ll_players")
    .insert({
      room_id: (room as RoomRow).id,
      name,
      team: null,
      emoji: randomFace(),
      is_host: true,
      seat: 0,
    })
    .select("*")
    .single();

  if (!player) {
    fail(500);
  }

  const token = await createSecret((player as PlayerRow).id);

  await serverClient()
    .from("ll_rooms")
    .update({ host_id: (player as PlayerRow).id })
    .eq("id", (room as RoomRow).id);

  return { code, token, playerId: (player as PlayerRow).id };
}

export async function joinRoom(code: string, rawName: string) {
  const name = rawName.trim();

  if (name.length < 2) {
    fail(400);
  }

  const room = await roomByCode(code);

  if (room.status !== "lobby") {
    fail(409);
  }

  const { count } = await serverClient()
    .from("ll_players")
    .select("id", { count: "exact", head: true })
    .eq("room_id", room.id);

  const { data: player } = await serverClient()
    .from("ll_players")
    .insert({
      room_id: room.id,
      name,
      team: null,
      seat: count ?? 0,
      emoji: randomFace(await facesTaken(room.id)),
    })
    .select("*")
    .single();

  if (!player) {
    fail(500);
  }

  const token = await createSecret((player as PlayerRow).id);

  await serverClient()
    .from("ll_rooms")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", room.id);

  return { code: room.code, token, playerId: (player as PlayerRow).id };
}

async function facesTaken(roomId: string): Promise<string[]> {
  const { data } = await serverClient()
    .from("ll_players")
    .select("emoji")
    .eq("room_id", roomId);

  return ((data as { emoji: string | null }[] | null) ?? [])
    .map((row) => row.emoji)
    .filter((emoji): emoji is string => Boolean(emoji));
}

export async function roomByCode(code: string): Promise<RoomRow> {
  const { data } = await serverClient()
    .from("ll_rooms")
    .select("*")
    .eq("code", code.trim())
    .maybeSingle();

  if (!data) {
    fail(404);
  }

  return data as RoomRow;
}

export async function playerByToken(
  roomId: string,
  token: string,
): Promise<PlayerRow> {
  const { data } = await serverClient()
    .from("ll_player_secrets")
    .select("player_id, ll_players!inner(*)")
    .eq("secret", token)
    .eq("ll_players.room_id", roomId)
    .maybeSingle();

  const row = data as { ll_players: PlayerRow } | null;

  if (!row?.ll_players) {
    fail(401);
  }

  return row.ll_players;
}

async function roomPlayers(roomId: string): Promise<PlayerRow[]> {
  const { data } = await serverClient()
    .from("ll_players")
    .select("*")
    .eq("room_id", roomId)
    .order("seat", { ascending: true });

  return (data as PlayerRow[] | null) ?? [];
}

async function roomResults(roomId: string): Promise<ResultRow[]> {
  const { data } = await serverClient()
    .from("ll_results")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  return (data as ResultRow[] | null) ?? [];
}

async function currentTurn(room: RoomRow): Promise<TurnRow | null> {
  if (!room.current_turn_id) {
    return null;
  }

  const { data } = await serverClient()
    .from("ll_turns")
    .select("*")
    .eq("id", room.current_turn_id)
    .maybeSingle();

  return (data as TurnRow | null) ?? null;
}

async function turnSongs(turnId: string): Promise<TurnSongRow[]> {
  const { data } = await serverClient()
    .from("ll_turn_songs")
    .select("*")
    .eq("turn_id", turnId)
    .order("position", { ascending: true });

  return (data as TurnSongRow[] | null) ?? [];
}

export async function setTeam(room: RoomRow, me: PlayerRow, team: Team) {
  if (room.status !== "lobby") {
    fail(409);
  }

  await serverClient().from("ll_players").update({ team }).eq("id", me.id);
}

const deckModes: DeckMode[] = ["national", "international", "mixed"];
const twistNames: Twist[] = ["whistle", "hum", "bomb", "duel"];

export async function setDeck(room: RoomRow, me: PlayerRow, deckMode: DeckMode) {
  if (!me.is_host) {
    fail(403);
  }

  if (!deckModes.includes(deckMode)) {
    fail(400);
  }

  await serverClient()
    .from("ll_rooms")
    .update({ deck_mode: deckMode, updated_at: new Date().toISOString() })
    .eq("id", room.id);
}

export async function setTwists(
  room: RoomRow,
  me: PlayerRow,
  twists: Twist[],
  stealEnabled: boolean,
) {
  if (!me.is_host) {
    fail(403);
  }

  if (twists.some((twist) => !twistNames.includes(twist))) {
    fail(400);
  }

  await serverClient()
    .from("ll_rooms")
    .update({
      twists,
      steal_enabled: stealEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id);
}

export async function shuffleTeams(room: RoomRow, me: PlayerRow) {
  if (!me.is_host) {
    fail(403);
  }

  const players = await roomPlayers(room.id);
  const map = assignTeams(players);

  await Promise.all(
    [...map.entries()].map(([playerId, team]) =>
      serverClient().from("ll_players").update({ team }).eq("id", playerId),
    ),
  );
}

async function buildPile(room: RoomRow) {
  const pool = shuffle(songsFor(room.deck_mode));

  await serverClient().from("ll_draw_pile").delete().eq("room_id", room.id);

  await serverClient()
    .from("ll_draw_pile")
    .insert(
      pool.map((song, index) => ({
        room_id: room.id,
        song_id: song.id,
        position: index,
      })),
    );
}

async function drawSongs(room: RoomRow, howMany: number): Promise<string[]> {
  const client = serverClient();

  const { data } = await client
    .from("ll_draw_pile")
    .select("song_id, position")
    .eq("room_id", room.id)
    .order("position", { ascending: true })
    .limit(howMany);

  let picked = (data as { song_id: string }[] | null) ?? [];

  if (picked.length < howMany) {
    await buildPile(room);

    const { data: refilled } = await client
      .from("ll_draw_pile")
      .select("song_id")
      .eq("room_id", room.id)
      .order("position", { ascending: true })
      .limit(howMany);

    picked = (refilled as { song_id: string }[] | null) ?? [];
  }

  const ids = picked.map((row) => row.song_id);

  await client
    .from("ll_draw_pile")
    .delete()
    .eq("room_id", room.id)
    .in("song_id", ids);

  return ids;
}

async function createTurn(
  room: RoomRow,
  players: PlayerRow[],
  previousTeam: Team | null,
): Promise<TurnRow | null> {
  const plan = nextTurn(players, previousTeam);

  if (!plan) {
    return null;
  }

  const twist = pickTwist(room.twists ?? []);
  const songIds = await drawSongs(room, songsPerTurn);
  const bombPosition =
    twist === "bomb" ? shuffle(songIds.map((_, index) => index))[0] : null;

  const { data } = await serverClient()
    .from("ll_turns")
    .insert({
      room_id: room.id,
      singer_id: plan.singerId,
      team: plan.team,
      twist,
      bomb_position: bombPosition,
    })
    .select("*")
    .single();

  const turn = data as TurnRow | null;

  if (!turn) {
    fail(500);
  }

  await serverClient()
    .from("ll_turn_songs")
    .insert(
      songIds.map((songId, index) => ({
        turn_id: turn.id,
        song_id: songId,
        position: index,
      })),
    );

  return turn;
}

export async function startGame(room: RoomRow, me: PlayerRow) {
  if (!me.is_host) {
    fail(403);
  }

  if (room.status !== "lobby") {
    fail(409);
  }

  const players = await roomPlayers(room.id);

  if (!canStart(players)) {
    throw new ServiceError(
      400,
      "Dá pra jogar em dupla ou de 4 pra cima. Com 3, alguém fica sozinho e não teria pra quem cantar.",
    );
  }

  await buildPile(room);

  const turn = await createTurn(room, players, null);

  if (!turn) {
    fail(500);
  }

  await serverClient()
    .from("ll_rooms")
    .update({
      status: "playing",
      current_turn_id: turn.id,
      round_number: 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id);
}

export async function startTurn(room: RoomRow, me: PlayerRow) {
  const turn = await currentTurn(room);

  if (!turn) {
    fail(409);
  }

  if (turn.singer_id !== me.id) {
    fail(403);
  }

  if (turn.status !== "ready") {
    fail(409);
  }

  const now = Date.now();

  await serverClient()
    .from("ll_turns")
    .update({
      status: "running",
      started_at: new Date(now).toISOString(),
      ends_at: new Date(now + room.turn_seconds * 1000).toISOString(),
      answer_ends_at:
        room.play_mode === "online"
          ? new Date(
              now + room.turn_seconds * 1000 + answerSeconds * 1000,
            ).toISOString()
          : null,
    })
    .eq("id", turn.id);
}

export async function markSong(
  room: RoomRow,
  me: PlayerRow,
  songId: string,
  outcome: Outcome,
) {
  const turn = await currentTurn(room);

  if (!turn) {
    fail(409);
  }

  const isStealPhase = turn.status === "stealing";

  if (turn.singer_id !== me.id) {
    fail(403);
  }

  if (!isStealPhase && turn.status !== "running") {
    fail(409);
  }

  if (isStealPhase && outcome !== "stolen" && outcome !== "missed") {
    fail(409);
  }

  if (room.play_mode === "online" && outcome !== "missed") {
    throw new ServiceError(
      403,
      "Na versão online o ponto vem do palpite de quem ouviu.",
    );
  }

  const songs = await turnSongs(turn.id);
  const target = songs.find((row) => row.song_id === songId);

  if (!target || target.outcome !== null) {
    fail(409);
  }

  const players = await roomPlayers(room.id);
  const duel = isOneOnOne(players);
  const points = pointsFor(
    outcome,
    turn.bomb_position !== null && turn.bomb_position === target.position,
  );
  const scoringTeam = scoringTeamFor(outcome, turn.team, duel);
  const client = serverClient();

  const { data: claimed } = await client
    .from("ll_turn_songs")
    .update({ outcome })
    .eq("turn_id", turn.id)
    .eq("song_id", songId)
    .is("outcome", null)
    .select("song_id");

  if (((claimed as { song_id: string }[] | null) ?? []).length === 0) {
    fail(409);
  }

  const { error } = await client.from("ll_results").insert({
    room_id: room.id,
    turn_id: turn.id,
    song_id: songId,
    outcome,
    scoring_team: scoringTeam,
    points,
  });

  if (error) {
    await client
      .from("ll_turn_songs")
      .update({ outcome: null })
      .eq("turn_id", turn.id)
      .eq("song_id", songId);

    throw new ServiceError(500, "Não consegui gravar o ponto. Tenta de novo.");
  }
}

export async function closeTurn(room: RoomRow, me: PlayerRow) {
  const turn = await currentTurn(room);

  if (!turn || turn.status === "done") {
    return;
  }

  const deadline = turn.answer_ends_at ?? turn.ends_at;
  const ranOut = deadline ? Date.parse(deadline) <= Date.now() : false;

  if (!ranOut && turn.singer_id !== me.id && !me.is_host) {
    throw new ServiceError(403, "Só quem canta encerra antes do tempo.");
  }

  if (turn.paused_at) {
    throw new ServiceError(409, "O tempo está parado.");
  }

  const songs = await turnSongs(turn.id);
  let pending = songs.filter((row) => row.outcome === null);

  if (room.play_mode === "online" && turn.status === "running") {
    pending = await dropSongsWithoutTake(turn, pending);
  }

  const squad = await roomPlayers(room.id);
  const soloSinger = isOneOnOne(squad);

  if (
    turn.status === "running" &&
    room.steal_enabled &&
    !soloSinger &&
    pending.length > 0
  ) {
    await claimTurnStatus(turn, "running", "stealing");

    return;
  }

  if (!(await claimTurnStatus(turn, turn.status, "done"))) {
    return;
  }

  await finishTurn(room, turn, pending);
}

async function claimTurnStatus(
  turn: TurnRow,
  from: TurnStatus,
  to: TurnStatus,
): Promise<boolean> {
  const { data } = await serverClient()
    .from("ll_turns")
    .update({ status: to })
    .eq("id", turn.id)
    .eq("status", from)
    .select("id");

  return ((data as { id: string }[] | null) ?? []).length > 0;
}

async function dropSongsWithoutTake(
  turn: TurnRow,
  pending: TurnSongRow[],
): Promise<TurnSongRow[]> {
  const { data } = await serverClient()
    .from("ll_takes")
    .select("song_id")
    .eq("turn_id", turn.id);

  const recorded = new Set(
    ((data as { song_id: string }[] | null) ?? []).map((row) => row.song_id),
  );

  const neverSung = pending.filter((row) => !recorded.has(row.song_id));

  if (neverSung.length > 0) {
    await serverClient()
      .from("ll_turn_songs")
      .update({ outcome: "missed" })
      .eq("turn_id", turn.id)
      .in(
        "song_id",
        neverSung.map((row) => row.song_id),
      );
  }

  return pending.filter((row) => recorded.has(row.song_id));
}

async function finishTurn(
  room: RoomRow,
  turn: TurnRow,
  pending: TurnSongRow[],
) {
  if (pending.length > 0) {
    await serverClient()
      .from("ll_turn_songs")
      .update({ outcome: "missed" })
      .eq("turn_id", turn.id)
      .is("outcome", null);
  }

  const { data: singerRow } = await serverClient()
    .from("ll_players")
    .select("spoke_count")
    .eq("id", turn.singer_id)
    .maybeSingle();

  await serverClient()
    .from("ll_players")
    .update({
      spoke_count:
        ((singerRow as { spoke_count: number } | null)?.spoke_count ?? 0) + 1,
    })
    .eq("id", turn.singer_id);

  const players = await roomPlayers(room.id);

  if (isGameOver(players)) {
    await saveMatch(room, players);

    await serverClient()
      .from("ll_rooms")
      .update({
        status: "done",
        current_turn_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);

    return;
  }

  const next = await createTurn(room, players, turn.team);

  if (!next) {
    await serverClient()
      .from("ll_rooms")
      .update({ status: "done", current_turn_id: null })
      .eq("id", room.id);

    return;
  }

  await serverClient()
    .from("ll_rooms")
    .update({
      current_turn_id: next.id,
      round_number: room.round_number + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id);
}

export async function endStealPhase(room: RoomRow, me: PlayerRow) {
  const turn = await currentTurn(room);

  if (!turn || turn.status !== "stealing") {
    fail(409);
  }

  if (turn.singer_id !== me.id) {
    fail(403);
  }

  const songs = await turnSongs(turn.id);

  if (!(await claimTurnStatus(turn, "stealing", "done"))) {
    return;
  }

  await finishTurn(
    room,
    turn,
    songs.filter((row) => row.outcome === null),
  );
}

async function saveMatch(room: RoomRow, players: PlayerRow[]) {
  if (room.is_test) {
    return;
  }

  const results = await roomResults(room.id);
  const score = scoreFrom(results);

  await serverClient()
    .from("ll_matches")
    .insert({
      room_code: room.code,
      deck_mode: room.deck_mode,
      score_red: score.red,
      score_blue: score.blue,
      winner: winnerOf(score),
      songs_played: results.length,
      players: players
        .filter((player) => player.team !== null)
        .map((player) => ({ name: player.name, team: player.team })),
    });
}

export async function pauseTurn(room: RoomRow, me: PlayerRow) {
  const turn = await currentTurn(room);

  if (!turn || turn.status !== "running") {
    fail(409);
  }

  if (!me.is_host && turn.singer_id !== me.id) {
    throw new ServiceError(403, "Só quem canta ou quem criou a sala pausa.");
  }

  if (turn.paused_at) {
    return;
  }

  await serverClient()
    .from("ll_turns")
    .update({ paused_at: new Date().toISOString() })
    .eq("id", turn.id);
}

export async function resumeTurn(room: RoomRow, me: PlayerRow) {
  const turn = await currentTurn(room);

  if (!turn || turn.status !== "running") {
    fail(409);
  }

  if (!me.is_host && turn.singer_id !== me.id) {
    throw new ServiceError(403, "Só quem canta ou quem criou a sala pausa.");
  }

  if (!turn.paused_at || !turn.ends_at) {
    return;
  }

  const held = Date.now() - new Date(turn.paused_at).getTime();

  await serverClient()
    .from("ll_turns")
    .update({
      paused_at: null,
      ends_at: new Date(new Date(turn.ends_at).getTime() + held).toISOString(),
      answer_ends_at: turn.answer_ends_at
        ? new Date(new Date(turn.answer_ends_at).getTime() + held).toISOString()
        : null,
    })
    .eq("id", turn.id);
}

export async function undoLastResult(room: RoomRow, me: PlayerRow) {
  if (!me.is_host) {
    throw new ServiceError(403, "Só quem criou a sala pode desfazer.");
  }

  const client = serverClient();

  const { data } = await client
    .from("ll_results")
    .select("*")
    .eq("room_id", room.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const last = ((data as ResultRow[] | null) ?? [])[0];

  if (!last) {
    throw new ServiceError(409, "Não tem jogada pra desfazer.");
  }

  await client.from("ll_results").delete().eq("id", last.id);

  await client
    .from("ll_turn_songs")
    .update({ outcome: null })
    .eq("turn_id", last.turn_id)
    .eq("song_id", last.song_id);

  await client
    .from("ll_takes")
    .update({ solved_by: null, solved_at: null })
    .eq("turn_id", last.turn_id)
    .eq("song_id", last.song_id);

  return last;
}

export async function restartMatch(room: RoomRow, me: PlayerRow) {
  if (!me.is_host) {
    fail(403);
  }

  const client = serverClient();

  await client.from("ll_results").delete().eq("room_id", room.id);
  await client.from("ll_turns").delete().eq("room_id", room.id);
  await client
    .from("ll_players")
    .update({ spoke_count: 0 })
    .eq("room_id", room.id);

  await client
    .from("ll_rooms")
    .update({
      status: "lobby",
      current_turn_id: null,
      round_number: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id);
}

function visibleSongs(
  songs: TurnSongRow[],
  canSeeTitles: boolean,
): Array<{ song: Song | null; songId: string; outcome: Outcome | null }> {
  return songs.map((row) => ({
    songId: row.song_id,
    outcome: row.outcome,
    song: canSeeTitles ? songById(row.song_id) : null,
  }));
}

export async function bombSongIdFor(
  turn: TurnRow,
  songs: TurnSongRow[],
): Promise<string | null> {
  if (turn.bomb_position === null) {
    return null;
  }

  const rows = songs.length > 0 ? songs : await turnSongs(turn.id);

  return (
    rows.find((row) => row.position === turn.bomb_position)?.song_id ?? null
  );
}

export async function roomState(room: RoomRow, me: PlayerRow) {
  const [players, results] = await Promise.all([
    roomPlayers(room.id),
    roomResults(room.id),
  ]);

  const turn = await currentTurn(room);
  const isSinger = turn?.singer_id === me.id;
  const songs = turn ? await turnSongs(turn.id) : [];
  const revealed = isSinger || turn?.status === "done";

  return {
    room,
    players,
    turn:
      turn && revealed
        ? { ...turn, bomb_song_id: await bombSongIdFor(turn, songs) }
        : turn,
    me,
    isSinger,
    songs: visibleSongs(songs, revealed),
    score: scoreFrom(results),
    results: results.slice(-12),
    now: new Date().toISOString(),
  };
}
