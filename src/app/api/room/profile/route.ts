import {
  handle,
  playerByToken,
  readBody,
  reject,
  roomByCode,
} from "@/app/api/_shared";
import { faces } from "@/data/faces";
import { ServiceError } from "@/lib/messages";
import { serverClient } from "@/lib/supabase/server";

interface Body {
  code?: string;
  token?: string;
  emoji?: string;
}

export async function POST(request: Request) {
  return handle(async () => {
    const payload = await readBody<Body>(request);

    if (!payload.code || !payload.token || !payload.emoji) {
      reject(400);
    }

    if (!faces.includes(payload.emoji)) {
      throw new ServiceError(422, "Escolhe um dos bichinhos da lista.");
    }

    const room = await roomByCode(payload.code);
    const me = await playerByToken(room.id, payload.token);

    await serverClient()
      .from("ll_players")
      .update({ emoji: payload.emoji, avatar: null })
      .eq("id", me.id);

    return { emoji: payload.emoji };
  });
}
