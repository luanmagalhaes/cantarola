import type { ChatMessage } from "@/types/game";

export const unreadCap = 9;

export function countUnread(
  messages: ChatMessage[],
  seenId: string | null,
  myId: string | null,
): number {
  const at = seenId ? messages.findIndex((message) => message.id === seenId) : -1;

  return messages.slice(at + 1).filter((message) => message.player_id !== myId).length;
}

export function unreadLabel(count: number): string {
  return count > unreadCap ? `${unreadCap}+` : String(count);
}
