import {
  handle,
  playerByToken,
  readBody,
  readForm,
  reject,
  requireQuery,
  roomByCode,
} from "@/app/api/_shared";
import { listMessages, saveAudio, saveText } from "@/lib/game/chat";

interface Body {
  code?: string;
  token?: string;
  body?: string;
}

export async function GET(request: Request) {
  return handle(async () => {
    const [code, token] = requireQuery(request, ["code", "token"]);
    const room = await roomByCode(code);

    await playerByToken(room.id, token);

    return { messages: await listMessages(room.id) };
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const type = request.headers.get("content-type") ?? "";

    if (type.includes("multipart/form-data")) {
      const form = await readForm(request);
      const code = String(form.get("code") ?? "").trim();
      const token = String(form.get("token") ?? "").trim();
      const seconds = Number(String(form.get("seconds") ?? ""));
      const file = form.get("file");

      if (!code || !token || !(file instanceof Blob)) {
        reject(400);
      }

      const room = await roomByCode(code);
      const me = await playerByToken(room.id, token);

      return {
        message: await saveAudio({
          roomId: room.id,
          playerId: me.id,
          authorName: me.name,
          file,
          seconds,
        }),
      };
    }

    const payload = await readBody<Body>(request);

    if (!payload.code || !payload.token || !payload.body) {
      reject(400);
    }

    const room = await roomByCode(payload.code);
    const me = await playerByToken(room.id, payload.token);

    return {
      message: await saveText({
        roomId: room.id,
        playerId: me.id,
        authorName: me.name,
        body: payload.body,
      }),
    };
  });
}
