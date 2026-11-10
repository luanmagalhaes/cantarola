import { describe, expect, it } from "vitest";
import { cropFrameFor, initialsFor } from "@/lib/photo";

const frame = 264;

describe("recorte da foto", () => {
  it("sem zoom, pega o quadrado do meio de uma foto deitada", () => {
    const crop = cropFrameFor({
      naturalWidth: 1000,
      naturalHeight: 500,
      frame,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });

    expect(crop.box.size).toBe(500);
    expect(crop.box.x).toBeCloseTo(250);
    expect(crop.box.y).toBeCloseTo(0);
  });

  it("não deixa arrastar para fora da foto", () => {
    const crop = cropFrameFor({
      naturalWidth: 1000,
      naturalHeight: 500,
      frame,
      zoom: 1,
      offsetX: 9000,
      offsetY: 9000,
    });

    expect(crop.box.x).toBeCloseTo(0);
    expect(crop.box.y).toBeCloseTo(0);
    expect(crop.limitY).toBe(0);
  });

  it("zoom fecha o recorte sem sair da foto", () => {
    const crop = cropFrameFor({
      naturalWidth: 800,
      naturalHeight: 800,
      frame,
      zoom: 2,
      offsetX: 0,
      offsetY: 0,
    });

    expect(crop.box.size).toBeCloseTo(400);
    expect(crop.box.x).toBeCloseTo(200);
    expect(crop.box.y).toBeCloseTo(200);
  });

  it("arrastar muda o pedaço escolhido", () => {
    const middle = cropFrameFor({
      naturalWidth: 1200,
      naturalHeight: 600,
      frame,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
    const moved = cropFrameFor({
      naturalWidth: 1200,
      naturalHeight: 600,
      frame,
      zoom: 1,
      offsetX: 60,
      offsetY: 0,
    });

    expect(moved.box.x).toBeLessThan(middle.box.x);
    expect(moved.box.size).toBeCloseTo(middle.box.size);
  });
});

describe("iniciais", () => {
  it("usa a primeira e a última palavra", () => {
    expect(initialsFor("Teste A")).toBe("TA");
    expect(initialsFor("Coruja")).toBe("CO");
    expect(initialsFor("   ")).toBe("?");
  });
});
