import {
  activeTurn,
  handle,
  playerByToken,
  readBody,
  reject,
  roomByCode,
} from "@/app/api/_shared";
import { toggleReaction } from "@/lib/game/reactions";
import { ServiceError } from "@/lib/messages";
import { serverClient } from "@/lib/supabase/server";

interface Body {
  code?: string;
  token?: string;
  takeId?: string;
  emoji?: string;
}

export async function POST(request: Request) {
  return handle(async () => {
    const payload = await readBody<Body>(request);

    if (!payload.code || !payload.token || !payload.takeId || !payload.emoji) {
      reject(400);
    }

    const room = await roomByCode(payload.code);
    const me = await playerByToken(room.id, payload.token);
    const turn = await activeTurn(room);

    if (!turn) {
      reject(409);
    }

    const { data } = await serverClient()
      .from("ll_takes")
      .select("id, turn_id")
      .eq("id", payload.takeId)
      .maybeSingle();

    const take = data as { id: string; turn_id: string } | null;

    if (!take || take.turn_id !== turn.id) {
      reject(404);
    }

    if (turn.singer_id === me.id) {
      throw new ServiceError(403, "Você gravou essa — só dá pra ver as reações.");
    }

    return toggleReaction({
      takeId: payload.takeId,
      playerId: me.id,
      emoji: payload.emoji,
    });
  });
}
