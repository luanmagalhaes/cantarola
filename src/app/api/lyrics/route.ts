import { handle, requireQuery } from "@/app/api/_shared";
import { findLyrics } from "@/lib/lyrics";

export async function GET(request: Request) {
  return handle(async () => {
    const [artist, title] = requireQuery(request, ["artist", "title"]);

    return { lyrics: await findLyrics(artist, title) };
  });
}
