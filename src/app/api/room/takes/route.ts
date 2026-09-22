import {
  activeTurn,
  handle,
  playerByToken,
  requireQuery,
  roomByCode,
  roomPlayers,
  type TakeRow,
} from "@/app/api/_shared";
import { reactionsByTake, tally } from "@/lib/game/reactions";
import { serverClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  return handle(async () => {
    const [code, token] = requireQuery(request, ["code", "token"]);

    const room = await roomByCode(code);
    const me = await playerByToken(room.id, token);
    const turn = await activeTurn(room);

    if (!turn) {
      return { takes: [] };
    }

    const { data } = await serverClient()
      .from("ll_takes")
      .select("*")
      .eq("turn_id", turn.id)
      .order("created_at", { ascending: true });

    const rows = (data as TakeRow[] | null) ?? [];
    const players = await roomPlayers(room.id);
    const nameById = new Map(players.map((player) => [player.id, player.name]));
    const isSinger = turn.singer_id === me.id;
    const reactions = await reactionsByTake(rows.map((row) => row.id));

    return {
      takes: rows.map((row) => {
        const mine = reactions.get(row.id) ?? [];

        return {
          id: row.id,
          songId: row.solved_by !== null || isSinger ? row.song_id : null,
          audioUrl: row.audio_url,
          seconds: row.seconds,
          solved: row.solved_by !== null,
          solvedByName: row.solved_by
            ? (nameById.get(row.solved_by) ?? null)
            : null,
          reactions: tally(mine),
          myReaction:
            mine.find((entry) => entry.player_id === me.id)?.emoji ?? null,
        };
      }),
    };
  });
}
