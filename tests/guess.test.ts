import { describe, expect, it } from "vitest";
import { answerMatches } from "@/lib/guess";

const cases: [string, string, boolean][] = [
  ["Evidências", "Evidências", true],
  ["evidencias", "Evidências", true],
  ["EVIDENCIAS!!", "Evidências", true],
  ["evidenscias", "Evidências", true],
  ["shake it off", "Shake It Off", true],
  ["shake", "Shake It Off", false],
  ["love", "We Found Love", false],
  ["we found love", "We Found Love", true],
  ["bohemian rapsody", "Bohemian Rhapsody", true],
  ["a musica evidencias", "Evidências", true],
  ["never gonna give you up", "Never Gonna Give You Up", true],
  ["all i want for christmas", "All I Want for Christmas Is You", true],
  ["thank u next", "Thank U, Next", true],
  ["nao sei essa", "Bohemian Rhapsody", false],
  ["aquela do tan tan tan", "Evidências", false],
];

describe("o que o palpite aceita", () => {
  cases.forEach(([guess, truth, expected]) => {
    it(`"${guess}" vs "${truth}" -> ${expected}`, () => {
      expect(answerMatches(guess, truth)).toBe(expected);
    });
  });
});
