import {
  handle,
  playerByToken,
  requireQuery,
  roomByCode,
} from "@/app/api/_shared";
import { songLog } from "@/lib/game/service";

export async function GET(request: Request) {
  return handle(async () => {
    const [code, token] = requireQuery(request, ["code", "token"]);
    const room = await roomByCode(code);

    await playerByToken(room.id, token);

    return { log: await songLog(room) };
  });
}
