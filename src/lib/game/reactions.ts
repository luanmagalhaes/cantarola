import { emojis } from "@/data/emojis";
import { ServiceError } from "@/lib/messages";
import { serverClient } from "@/lib/supabase/server";
import type { ReactionTally } from "@/types/game";

interface ReactionRow {
  take_id: string;
  player_id: string;
  emoji: string;
}

export async function reactionsByTake(
  takeIds: string[],
): Promise<Map<string, ReactionRow[]>> {
  const grouped = new Map<string, ReactionRow[]>();

  if (takeIds.length === 0) {
    return grouped;
  }

  const { data } = await serverClient()
    .from("ll_take_reactions")
    .select("take_id, player_id, emoji")
    .in("take_id", takeIds);

  ((data as ReactionRow[] | null) ?? []).forEach((row) => {
    const list = grouped.get(row.take_id) ?? [];

    list.push(row);
    grouped.set(row.take_id, list);
  });

  return grouped;
}

export function tally(rows: ReactionRow[]): ReactionTally[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    counts.set(row.emoji, (counts.get(row.emoji) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
}

export async function toggleReaction(input: {
  takeId: string;
  playerId: string;
  emoji: string;
}): Promise<{ emoji: string | null }> {
  if (!emojis.includes(input.emoji)) {
    throw new ServiceError(422, "Esse emoji não vale aqui.");
  }

  const client = serverClient();

  const { data: current } = await client
    .from("ll_take_reactions")
    .select("emoji")
    .eq("take_id", input.takeId)
    .eq("player_id", input.playerId)
    .maybeSingle();

  const mine = (current as { emoji: string } | null)?.emoji ?? null;

  if (mine === input.emoji) {
    await client
      .from("ll_take_reactions")
      .delete()
      .eq("take_id", input.takeId)
      .eq("player_id", input.playerId);

    return { emoji: null };
  }

  const { error } = await client.from("ll_take_reactions").upsert(
    {
      take_id: input.takeId,
      player_id: input.playerId,
      emoji: input.emoji,
    },
    { onConflict: "take_id,player_id" },
  );

  if (error) {
    throw new ServiceError(500, "Não consegui reagir agora.");
  }

  return { emoji: input.emoji };
}
