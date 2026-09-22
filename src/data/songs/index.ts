import type { DeckMode, Origin, Song } from "@/types/game";
import { national } from "./national";
import { international } from "./international";

type SongEntry = readonly [string, string, string];

const ID_PREFIX: Record<Origin, string> = {
  national: "n",
  international: "i",
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function songId(origin: Origin, title: string, artist: string): string {
  return `${ID_PREFIX[origin]}-${slugify(artist)}-${slugify(title)}`;
}

function buildDeck(
  entries: readonly SongEntry[],
  origin: Origin,
): readonly Song[] {
  return entries.map(([title, artist, hint]) => ({
    id: songId(origin, title, artist),
    title,
    artist,
    hint,
    origin,
  }));
}

function indexById(songs: readonly Song[]): ReadonlyMap<string, Song> {
  return new Map(songs.map((song) => [song.id, song] as const));
}

export const nationalSongs: readonly Song[] = buildDeck(national, "national");

export const internationalSongs: readonly Song[] = buildDeck(
  international,
  "international",
);

export const allSongs: readonly Song[] = [
  ...nationalSongs,
  ...internationalSongs,
];

const songsById = indexById(allSongs);

export function songById(id: string): Song | null {
  return songsById.get(id) ?? null;
}

export function songsFor(mode: DeckMode): Song[] {
  switch (mode) {
    case "national":
      return [...nationalSongs];
    case "international":
      return [...internationalSongs];
    case "mixed":
      return [...allSongs];
  }
}

export function duplicatedIds(): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();

  allSongs.forEach((song) => {
    if (seen.has(song.id)) {
      repeated.add(song.id);
    }

    seen.add(song.id);
  });

  return [...repeated];
}

export const deckSizes = {
  national: nationalSongs.length,
  international: internationalSongs.length,
  mixed: allSongs.length,
} as const;
