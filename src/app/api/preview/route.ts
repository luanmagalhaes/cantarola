import { handle, requireQuery } from "@/app/api/_shared";
import { findPreview } from "@/lib/deezer";

export async function GET(request: Request) {
  return handle(async () => {
    const [artist, title] = requireQuery(request, ["artist", "title"]);

    const match = await findPreview(artist, title);

    return { previewUrl: match.previewUrl };
  });
}
