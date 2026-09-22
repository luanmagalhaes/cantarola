import { randomUUID } from "node:crypto";
import { ServiceError } from "@/lib/messages";
import { serverClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/types/game";

export const maxMessageLength = 240;
export const maxAudioSeconds = 30;
export const maxAudioBytes = 2 * 1024 * 1024;
export const chatPageSize = 60;

const bucket = "ll-audio";

const extensionByMime: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
};

const columns =
  "id, player_id, author_name, kind, body, audio_url, audio_seconds, created_at";

function baseMime(mime: string): string {
  return mime.split(";")[0].trim().toLowerCase();
}

function tidy(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export async function listMessages(roomId: string): Promise<ChatMessage[]> {
  const { data } = await serverClient()
    .from("ll_messages")
    .select(columns)
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(chatPageSize);

  return ((data as ChatMessage[] | null) ?? []).reverse();
}

export async function saveText(input: {
  roomId: string;
  playerId: string;
  authorName: string;
  body: string;
}): Promise<ChatMessage> {
  const body = tidy(input.body);

  if (body.length === 0) {
    throw new ServiceError(422, "Escreve alguma coisa antes de mandar.");
  }

  if (body.length > maxMessageLength) {
    throw new ServiceError(
      422,
      `A mensagem cabe em ${maxMessageLength} letras.`,
    );
  }

  const { data, error } = await serverClient()
    .from("ll_messages")
    .insert({
      room_id: input.roomId,
      player_id: input.playerId,
      author_name: input.authorName,
      kind: "text",
      body,
    })
    .select(columns)
    .single();

  if (error || !data) {
    throw new ServiceError(500, "Não consegui mandar essa. Tenta de novo.");
  }

  return data as ChatMessage;
}

export async function saveAudio(input: {
  roomId: string;
  playerId: string;
  authorName: string;
  file: Blob;
  seconds: number;
}): Promise<ChatMessage> {
  const mime = baseMime(input.file.type);
  const extension = extensionByMime[mime];

  if (!extension) {
    throw new ServiceError(415, "Esse formato de áudio não rola aqui.");
  }

  if (input.file.size === 0 || input.file.size > maxAudioBytes) {
    throw new ServiceError(413, "O áudio ficou grande demais.");
  }

  if (
    !Number.isFinite(input.seconds) ||
    input.seconds <= 0 ||
    input.seconds > maxAudioSeconds
  ) {
    throw new ServiceError(
      422,
      `O áudio do chat vai até ${maxAudioSeconds} segundos.`,
    );
  }

  const client = serverClient();
  const path = `chat/${input.roomId}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await client.storage
    .from(bucket)
    .upload(path, input.file, { contentType: mime, upsert: false });

  if (uploadError) {
    throw new ServiceError(500, "Não consegui guardar esse áudio.");
  }

  const audioUrl = client.storage.from(bucket).getPublicUrl(path).data
    .publicUrl;

  const { data, error } = await client
    .from("ll_messages")
    .insert({
      room_id: input.roomId,
      player_id: input.playerId,
      author_name: input.authorName,
      kind: "audio",
      audio_url: audioUrl,
      audio_seconds: Math.max(1, Math.round(input.seconds)),
    })
    .select(columns)
    .single();

  if (error || !data) {
    throw new ServiceError(500, "Não consegui mandar esse áudio.");
  }

  return data as ChatMessage;
}
