import { handle, readBody } from "@/app/api/_shared";
import { createRoom, type PlayMode } from "@/lib/game/service";
import { looksLikeRobot } from "@/lib/game/testDetection";
import type { DeckMode } from "@/types/game";

interface Body {
  name?: string;
  deckMode?: DeckMode;
  playMode?: PlayMode;
}

export async function POST(request: Request) {
  return handle(async () => {
    const payload = await readBody<Body>(request);

    return createRoom({
      name: payload.name ?? "",
      deckMode: payload.deckMode ?? "mixed",
      playMode: payload.playMode ?? "local",
      isTest: looksLikeRobot(request),
    });
  });
}
