import {
  handle,
  playerByToken,
  readBody,
  reject,
  roomByCode,
} from "@/app/api/_shared";
import {
  restartMatch,
  setDeck,
  setTeam,
  setTwists,
  shuffleTeams,
  startGame,
} from "@/lib/game/service";
import type { DeckMode, Team, Twist } from "@/types/game";

type Action = "team" | "deck" | "twists" | "draw" | "start" | "restart";

interface Body {
  code?: string;
  token?: string;
  action?: Action;
  team?: Team;
  deckMode?: DeckMode;
  twists?: Twist[];
  stealEnabled?: boolean;
}

export async function POST(request: Request) {
  return handle(async () => {
    const payload = await readBody<Body>(request);

    if (!payload.code || !payload.token || !payload.action) {
      reject(400);
    }

    const room = await roomByCode(payload.code);
    const me = await playerByToken(room.id, payload.token);

    if (payload.action === "team" && payload.team) {
      await setTeam(room, me, payload.team);
      return { ok: true };
    }

    if (payload.action === "deck" && payload.deckMode) {
      await setDeck(room, me, payload.deckMode);
      return { ok: true };
    }

    if (payload.action === "twists" && Array.isArray(payload.twists)) {
      await setTwists(room, me, payload.twists, payload.stealEnabled !== false);
      return { ok: true };
    }

    if (payload.action === "draw") {
      await shuffleTeams(room, me);
      return { ok: true };
    }

    if (payload.action === "start") {
      await startGame(room, me);
      return { ok: true };
    }

    if (payload.action === "restart") {
      await restartMatch(room, me);
      return { ok: true };
    }

    return reject(400);
  });
}
