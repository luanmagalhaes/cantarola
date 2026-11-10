import { handle } from "@/app/api/_shared";
import { closeStaleMatches } from "@/lib/game/service";
import { serverClient } from "@/lib/supabase/server";
import type { MatchRow } from "@/types/game";

const limit = 120;

export async function GET() {
  return handle(async () => {
    await closeStaleMatches();

    const { data } = await serverClient()
      .from("ll_matches")
      .select("*")
      .order("finished_at", { ascending: false })
      .limit(limit);

    return { matches: (data as MatchRow[] | null) ?? [] };
  });
}
