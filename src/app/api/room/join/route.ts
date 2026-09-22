import { handle, readBody } from "@/app/api/_shared";
import { joinRoom } from "@/lib/game/service";

interface Body {
  code?: string;
  name?: string;
}

export async function POST(request: Request) {
  return handle(async () => {
    const payload = await readBody<Body>(request);

    return joinRoom(payload.code ?? "", payload.name ?? "");
  });
}
