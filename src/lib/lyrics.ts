import { normalize } from "@/lib/deezer";

interface LrclibTrack {
  artistName?: string;
  trackName?: string;
  plainLyrics?: string | null;
  instrumental?: boolean;
}

const requestTimeoutMs = 6000;
const cache = new Map<string, string | null>();

function artistSpellings(artist: string): string[] {
  const swapped = /\s+e\s+/i.test(artist)
    ? artist.replace(/\s+e\s+/gi, " & ")
    : artist.includes("&")
      ? artist.replace(/\s*&\s*/g, " e ")
      : null;
  const first = artist.split(/\s+e\s+|\s*&\s*|,/i)[0]?.trim();

  return [
    ...new Set(
      [artist, swapped, first].filter((value): value is string =>
        Boolean(value),
      ),
    ),
  ];
}

function cleanLyrics(raw: string | null | undefined): string | null {
  const text = (raw ?? "").replace(/\r/g, "").trim();

  return text.length > 0 ? text : null;
}

function matches(track: LrclibTrack, artist: string, title: string): boolean {
  const sameTitle = normalize(track.trackName ?? "") === normalize(title);
  const trackArtist = normalize(track.artistName ?? "");
  const wanted = normalize(artist);

  if (!sameTitle || !trackArtist || !wanted) {
    return false;
  }

  return trackArtist.includes(wanted) || wanted.includes(trackArtist);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fromLrclibGet(
  artist: string,
  title: string,
): Promise<string | null> {
  const track = await fetchJson<LrclibTrack>(
    `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`,
  );

  return cleanLyrics(track?.plainLyrics);
}

async function fromLrclibSearch(
  artist: string,
  title: string,
): Promise<string | null> {
  const found = await fetchJson<LrclibTrack[]>(
    `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`,
  );

  const best = (found ?? []).find(
    (track) => matches(track, artist, title) && cleanLyrics(track.plainLyrics),
  );

  return cleanLyrics(best?.plainLyrics);
}

async function fromLyricsOvh(
  artist: string,
  title: string,
): Promise<string | null> {
  const payload = await fetchJson<{ lyrics?: string }>(
    `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
  );

  return cleanLyrics(payload?.lyrics);
}

export async function findLyrics(
  artist: string,
  title: string,
): Promise<string | null> {
  const key = normalize(`${artist} ${title}`);

  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }

  const names = artistSpellings(artist);

  const attempts = await Promise.all([
    ...names.map((name) => fromLrclibGet(name, title)),
    ...names.map((name) => fromLrclibSearch(name, title)),
    ...names.map((name) => fromLyricsOvh(name, title)),
  ]);

  const found = attempts.find((lyrics) => lyrics !== null) ?? null;

  cache.set(key, found);

  return found;
}
