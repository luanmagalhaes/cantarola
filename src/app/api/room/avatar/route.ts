import {
  handle,
  playerByToken,
  readForm,
  reject,
  roomByCode,
} from "@/app/api/_shared";
import { ServiceError } from "@/lib/messages";
import { serverClient } from "@/lib/supabase/server";

const bucket = "ll-avatars";
const maxBytes = 512 * 1024;

const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  return handle(async () => {
    const form = await readForm(request);
    const code = String(form.get("code") ?? "").trim();
    const token = String(form.get("token") ?? "").trim();
    const file = form.get("file");

    if (!code || !token || !(file instanceof Blob)) {
      reject(400);
    }

    const mime = file.type.split(";")[0].trim().toLowerCase();
    const extension = extensionByMime[mime];

    if (!extension) {
      throw new ServiceError(415, "Manda a foto em JPG, PNG ou WEBP.");
    }

    if (file.size === 0 || file.size > maxBytes) {
      throw new ServiceError(413, "A foto ficou pesada demais.");
    }

    const room = await roomByCode(code);
    const me = await playerByToken(room.id, token);
    const client = serverClient();
    const path = `${room.id}/${me.id}.${extension}`;

    const { error } = await client.storage
      .from(bucket)
      .upload(path, file, { contentType: mime, upsert: true });

    if (error) {
      throw new ServiceError(500, "Não consegui guardar essa foto.");
    }

    const published = client.storage.from(bucket).getPublicUrl(path).data
      .publicUrl;
    const avatar = `${published}?v=${Date.now()}`;

    await client
      .from("ll_players")
      .update({ avatar, emoji: null })
      .eq("id", me.id);

    return { avatar };
  });
}
