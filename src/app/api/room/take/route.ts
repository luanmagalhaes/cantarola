import { randomUUID } from "node:crypto";
import {
  activeTurn,
  handle,
  playerByToken,
  readForm,
  reject,
  roomByCode,
  turnSongs,
  type TakeRow,
} from "@/app/api/_shared";
import { ServiceError } from "@/lib/messages";
import { serverClient } from "@/lib/supabase/server";

const bucket = "ll-audio";
const maxBytes = 2 * 1024 * 1024;
const minBytes = 1024;
const maxSeconds = 90;

const extensionByMime: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
};

function textField(form: FormData, key: string): string {
  const value = form.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  return handle(async () => {
    const form = await readForm(request);

    const code = textField(form, "code");
    const token = textField(form, "token");
    const songId = textField(form, "songId");
    const seconds = Math.round(Number(textField(form, "seconds")));
    const file = form.get("file");

    if (!code || !token || !songId) {
      reject(400);
    }

    if (!(file instanceof Blob)) {
      reject(400);
    }

    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > maxSeconds) {
      reject(400);
    }

    if (file.size > maxBytes) {
      reject(400);
    }

    const expected = Number(textField(form, "expectedBytes"));

    if (Number.isFinite(expected) && expected > 0 && expected !== file.size) {
      throw new ServiceError(
        422,
        `O áudio chegou cortado (${file.size} de ${expected} bytes). Tente mandar de novo.`,
      );
    }

    if (file.size < minBytes) {
      throw new ServiceError(
        422,
        "A gravação saiu vazia. Grava de novo, segurando até aparecer o áudio.",
      );
    }

    const mime = file.type.split(";")[0].trim().toLowerCase();
    const extension = extensionByMime[mime];

    if (!extension) {
      reject(400);
    }

    const room = await roomByCode(code);
    const me = await playerByToken(room.id, token);
    const turn = await activeTurn(room);

    if (!turn) {
      reject(409);
    }

    if (turn.singer_id !== me.id) {
      reject(403);
    }

    const songs = await turnSongs(turn.id);
    const target = songs.find((row) => row.song_id === songId);

    if (!target || target.outcome !== null) {
      reject(409);
    }

    const client = serverClient();
    const path = `${room.id}/${randomUUID()}.${extension}`;

    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(path, file, { contentType: mime, upsert: false });

    if (uploadError) {
      reject(500);
    }

    const audioUrl = client.storage.from(bucket).getPublicUrl(path).data
      .publicUrl;

    const { data } = await client
      .from("ll_takes")
      .insert({
        room_id: room.id,
        turn_id: turn.id,
        song_id: songId,
        audio_url: audioUrl,
        seconds,
        measured_ms: Math.round(Number(textField(form, "measuredMs"))) || null,
        held_ms: Math.round(Number(textField(form, "heldMs"))) || null,
      })
      .select("*")
      .single();

    const take = data as TakeRow | null;

    if (!take) {
      reject(500);
    }

    return {
      take: { id: take.id, audioUrl: take.audio_url, seconds: take.seconds },
    };
  });
}
