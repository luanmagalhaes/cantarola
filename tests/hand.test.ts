import { describe, expect, it } from "vitest";
import { nextHandOrder } from "@/lib/game/hand";

describe("ordem da mão de músicas", () => {
  it("mantém a ordem quando nada muda", () => {
    expect(nextHandOrder(["a", "b", "c"], ["a", "b", "c"])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("guarda o lugar da música que saiu", () => {
    expect(nextHandOrder(["a", "b", "c"], ["b", "c"])).toEqual(["", "b", "c"]);
  });

  it("põe a música nova no lugar guardado", () => {
    expect(nextHandOrder(["", "b", "c"], ["b", "c", "d"])).toEqual([
      "d",
      "b",
      "c",
    ]);
  });

  it("troca no lugar quando sai e entra no mesmo instante", () => {
    expect(nextHandOrder(["a", "b", "c"], ["b", "c", "d"])).toEqual([
      "d",
      "b",
      "c",
    ]);
  });

  it("aceita a mão inicial inteira", () => {
    expect(nextHandOrder([], ["a", "b"])).toEqual(["a", "b"]);
  });

  it("não deixa lugar vago sobrando no fim", () => {
    expect(nextHandOrder(["a", "b"], ["a"])).toEqual(["a"]);
  });

  it("põe sobra no fim quando chega mais do que saiu", () => {
    expect(nextHandOrder(["a", "b"], ["a", "b", "c", "d"])).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });
});
