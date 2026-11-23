import {
  handle,
  playerByToken,
  readBody,
  reject,
  roomByCode,
} from "@/app/api/_shared";
import {
  approveWaiting,
  movePlayerTeam,
  removePlayer,
  restartMatch,
  restoreSeat,
  setDeck,
  setTeam,
  setTwists,
  shuffleTeams,
  startGame,
} from "@/lib/game/service";
import type { DeckMode, Team, Twist } from "@/types/game";

export const maxDuration = 60;

type Action =
  | "team"
  | "deck"
  | "twists"
  | "draw"
  | "start"
  | "restart"
  | "approve"
  | "restore"
  | "remove"
  | "move";

interface Body {
  code?: string;
  token?: string;
  action?: Action;
  team?: Team | null;
  playerId?: string;
  targetId?: string;
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

    if (payload.action === "approve" && payload.playerId && payload.team) {
      await approveWaiting(room, me, payload.playerId, payload.team);
      return { ok: true };
    }

    if (payload.action === "restore" && payload.playerId && payload.targetId) {
      await restoreSeat(room, me, payload.playerId, payload.targetId);
      return { ok: true };
    }

    if (payload.action === "remove" && payload.playerId) {
      await removePlayer(room, me, payload.playerId);
      return { ok: true };
    }

    if (payload.action === "move" && payload.playerId) {
      await movePlayerTeam(room, me, payload.playerId, payload.team ?? null);
      return { ok: true };
    }

    return reject(400);
  });
}
