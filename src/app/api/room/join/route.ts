import { handle, readBody } from "@/app/api/_shared";
import { closeStaleMatches } from "@/lib/game/service";
import { joinRoom } from "@/lib/game/service";

interface Body {
  code?: string;
  name?: string;
}

export async function POST(request: Request) {
  return handle(async () => {
    await closeStaleMatches();

    const payload = await readBody<Body>(request);

    return joinRoom(payload.code ?? "", payload.name ?? "");
  });
}
