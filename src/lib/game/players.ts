import type { PlayerRow } from "@/types/game";

export function nameOf(
  players: PlayerRow[],
  id: string | null | undefined,
): string {
  return players.find((player) => player.id === id)?.name ?? "alguém";
}
