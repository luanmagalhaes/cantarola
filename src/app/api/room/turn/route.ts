import {
  handle,
  playerByToken,
  readBody,
  reject,
  roomByCode,
} from "@/app/api/_shared";
import {
  chooseSinger,
  closeTurn,
  endMatch,
  endStealPhase,
  markSong,
  pauseTurn,
  reopenPick,
  resumeTurn,
  startTurn,
  undoLastResult,
} from "@/lib/game/service";
import { songById } from "@/data/songs";
import type { Outcome } from "@/types/game";

export const maxDuration = 60;

type Action =
  | "pick"
  | "unpick"
  | "end"
  | "start"
  | "mark"
  | "close"
  | "endSteal"
  | "undo"
  | "pause"
  | "resume";

interface Body {
  code?: string;
  token?: string;
  action?: Action;
  songId?: string;
  outcome?: Outcome;
  singerId?: string;
}

export async function POST(request: Request) {
  return handle(async () => {
    const payload = await readBody<Body>(request);

    if (!payload.code || !payload.token || !payload.action) {
      reject(400);
    }

    const room = await roomByCode(payload.code);
    const me = await playerByToken(room.id, payload.token);

    if (payload.action === "pick" && payload.singerId) {
      await chooseSinger(room, me, payload.singerId);
      return { ok: true };
    }

    if (payload.action === "unpick") {
      await reopenPick(room, me);
      return { ok: true };
    }

    if (payload.action === "end") {
      await endMatch(room, me);
      return { ok: true };
    }

    if (payload.action === "start") {
      await startTurn(room, me);
      return { ok: true };
    }

    if (payload.action === "mark" && payload.songId && payload.outcome) {
      await markSong(room, me, payload.songId, payload.outcome);
      return { ok: true };
    }

    if (payload.action === "close") {
      await closeTurn(room, me);
      return { ok: true };
    }

    if (payload.action === "endSteal") {
      await endStealPhase(room, me);
      return { ok: true };
    }

    if (payload.action === "pause") {
      await pauseTurn(room, me);
      return { ok: true };
    }

    if (payload.action === "resume") {
      await resumeTurn(room, me);
      return { ok: true };
    }

    if (payload.action === "undo") {
      const undone = await undoLastResult(room, me);

      return {
        ok: true,
        song: songById(undone.song_id)?.title ?? null,
        points: undone.points,
        team: undone.scoring_team,
      };
    }

    return reject(400);
  });
}
