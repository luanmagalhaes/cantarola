import { NextResponse } from "next/server";
import { ServiceError, messageFor } from "@/lib/messages";
import { serverClient } from "@/lib/supabase/server";
import type { PlayerRow, RoomRow, TurnRow, TurnSongRow } from "@/types/game";

export { playerByToken, roomByCode } from "@/lib/game/service";

export interface TakeRow {
  id: string;
  room_id: string;
  turn_id: string;
  song_id: string;
  audio_url: string;
  seconds: number;
  solved_by: string | null;
  solved_at: string | null;
  created_at: string;
}

export async function handle<T>(run: () => Promise<T>): Promise<NextResponse> {
  try {
    const payload = await run();

    return NextResponse.json(payload ?? { ok: true });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: messageFor(500) }, { status: 500 });
  }
}

export function reject(status: number): never {
  throw new ServiceError(status, messageFor(status));
}

export function demand<T>(value: T | null | undefined, status: number): T {
  if (value === null || value === undefined) {
    reject(status);
  }

  return value;
}

export async function readBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return reject(400);
  }
}

export async function readForm(request: Request): Promise<FormData> {
  try {
    return await request.formData();
  } catch {
    return reject(400);
  }
}

export function requireQuery(request: Request, keys: string[]): string[] {
  const url = new URL(request.url);

  return keys.map((key) => {
    const value = url.searchParams.get(key);

    if (!value) {
      reject(400);
    }

    return value;
  });
}

export async function roomPlayers(roomId: string): Promise<PlayerRow[]> {
  const { data } = await serverClient()
    .from("ll_players")
    .select("*")
    .eq("room_id", roomId)
    .order("seat", { ascending: true });

  return (data as PlayerRow[] | null) ?? [];
}

export async function activeTurn(room: RoomRow): Promise<TurnRow | null> {
  if (!room.current_turn_id) {
    return null;
  }

  const { data } = await serverClient()
    .from("ll_turns")
    .select("*")
    .eq("id", room.current_turn_id)
    .maybeSingle();

  return (data as TurnRow | null) ?? null;
}

export async function turnSongs(turnId: string): Promise<TurnSongRow[]> {
  const { data } = await serverClient()
    .from("ll_turn_songs")
    .select("*")
    .eq("turn_id", turnId)
    .order("position", { ascending: true });

  return (data as TurnSongRow[] | null) ?? [];
}
