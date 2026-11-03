import { describe, expect, it } from "vitest";
import {
  allSongs,
  internationalSongs,
  nationalSongs,
  songById,
  songsFor,
} from "@/data/songs";

describe("baralhos de músicas", () => {
  it("tem id único para cada música", () => {
    const ids = allSongs.map((song) => song.id);
    const repeated = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(repeated).toEqual([]);
  });

  it("tem título, artista e dica em toda música", () => {
    for (const song of allSongs) {
      expect(song.title.trim().length).toBeGreaterThan(0);
      expect(song.artist.trim().length).toBeGreaterThan(0);
      expect(song.hint.trim().length).toBeGreaterThan(0);
    }
  });

  it("tem baralho grande o bastante pro descanso de 24 horas", () => {
    expect(nationalSongs.length).toBeGreaterThanOrEqual(100);
    expect(internationalSongs.length).toBeGreaterThanOrEqual(100);
  });

  it("monta o baralho misto com os dois lados", () => {
    expect(songsFor("mixed")).toHaveLength(
      nationalSongs.length + internationalSongs.length,
    );
  });

  it("acha qualquer música pelo id", () => {
    for (const song of allSongs) {
      expect(songById(song.id)).toEqual(song);
    }
  });
});
