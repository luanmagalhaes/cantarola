import {
  activeTurn,
  demand,
  handle,
  playerByToken,
  readBody,
  reject,
  roomByCode,
  roomPlayers,
  type TakeRow,
} from "@/app/api/_shared";
import { songById } from "@/data/songs";
import { answerMatches } from "@/lib/guess";
import { pointsFor, singerIsAlone } from "@/lib/game/rules";
import { bombSongIdFor } from "@/lib/game/service";
import { serverClient } from "@/lib/supabase/server";

interface Body {
  code?: string;
  token?: string;
  takeId?: string;
  body?: string;
}

export async function POST(request: Request) {
  return handle(async () => {
    const payload = await readBody<Body>(request);

    if (!payload.code || !payload.token || !payload.takeId) {
      reject(400);
    }

    const guessText = (payload.body ?? "").trim();
    const room = await roomByCode(payload.code);
    const me = await playerByToken(room.id, payload.token);
    const turn = await activeTurn(room);

    if (!turn) {
      reject(409);
    }

    if (turn.singer_id === me.id) {
      reject(403);
    }

    if (turn.status !== "running" && turn.status !== "stealing") {
      reject(409);
    }

    const stealing = turn.status === "stealing";
    const isRival = me.team !== turn.team;
    const alone = singerIsAlone(await roomPlayers(room.id), turn.singer_id, turn.team);

    if (
      stealing
        ? !isRival
        : isRival && turn.twist !== "duel" && !alone
    ) {
      reject(403);
    }

    const client = serverClient();

    const { data } = await client
      .from("ll_takes")
      .select("*")
      .eq("id", payload.takeId)
      .maybeSingle();

    const take = demand(data as TakeRow | null, 404);

    if (take.room_id !== room.id || take.turn_id !== turn.id) {
      reject(409);
    }

    const logGuess = (correct: boolean) =>
      client.from("ll_guesses").insert({
        room_id: room.id,
        turn_id: turn.id,
        take_id: take.id,
        player_id: me.id,
        body: guessText,
        correct,
      });

    const song = demand(songById(take.song_id), 500);

    if (take.solved_by !== null || !answerMatches(guessText, song.title)) {
      await logGuess(false);

      return { correct: false, song: null };
    }

    const { data: claimed } = await client
      .from("ll_takes")
      .update({ solved_by: me.id, solved_at: new Date().toISOString() })
      .eq("id", take.id)
      .is("solved_by", null)
      .select("id");

    if (((claimed as { id: string }[] | null) ?? []).length === 0) {
      await logGuess(false);

      return { correct: false, song: null };
    }

    const outcome = isRival ? "stolen" : "hit";
    const bombSongId = await bombSongIdFor(turn, []);

    await client
      .from("ll_turn_songs")
      .update({ outcome })
      .eq("turn_id", turn.id)
      .eq("song_id", take.song_id);

    await client.from("ll_results").insert({
      room_id: room.id,
      turn_id: turn.id,
      song_id: take.song_id,
      outcome,
      scoring_team: me.team,
      points: pointsFor(outcome, bombSongId === take.song_id),
    });

    await logGuess(true);

    return { correct: true, song };
  });
}
