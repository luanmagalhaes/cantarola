export interface DeezerMatch {
  previewUrl: string | null;
  matchedArtist: string | null;
  matchedTitle: string | null;
  confident: boolean;
}

interface DeezerTrack {
  title?: string;
  preview?: string;
  rank?: number;
  artist?: { name?: string };
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(
      /\b(feat|ft|part|pt|remaster(ed)?|ao vivo|live|version|versao|radio edit|single)\b/g,
      " ",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function similar(a: string, b: string): boolean {
  const left = normalize(a);
  const right = normalize(b);

  if (!left || !right) {
    return false;
  }

  return left === right || left.includes(right) || right.includes(left);
}

async function search(query: string): Promise<DeezerTrack[]> {
  const response = await fetch(
    `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=15`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { data?: DeezerTrack[] };

  return payload.data ?? [];
}

function spellings(name: string): string[] {
  const swapped = /\s+e\s+/i.test(name)
    ? name.replace(/\s+e\s+/gi, " & ")
    : name.includes("&")
      ? name.replace(/\s*&\s*/g, " e ")
      : null;

  const bare = name.replace(/\s*&\s*/g, " ").replace(/\s+e\s+/gi, " ");

  return [
    ...new Set(
      [name, swapped, bare].filter((value): value is string => Boolean(value)),
    ),
  ];
}

export async function findPreview(
  artist: string,
  title: string,
): Promise<DeezerMatch> {
  const names = spellings(artist);
  const queries = [...names.map((name) => `${name} ${title}`), title];

  for (const query of queries) {
    const results = await search(query);

    const matches = results
      .filter((track) => track.preview)
      .filter(
        (track) =>
          names.some((name) => similar(track.artist?.name ?? "", name)) &&
          similar(track.title ?? "", title),
      )
      .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));

    const best = matches[0];

    if (best) {
      return {
        previewUrl: best.preview ?? null,
        matchedArtist: best.artist?.name ?? null,
        matchedTitle: best.title ?? null,
        confident: true,
      };
    }
  }

  return {
    previewUrl: null,
    matchedArtist: null,
    matchedTitle: null,
    confident: false,
  };
}
