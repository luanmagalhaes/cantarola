import { describe, expect, it } from "vitest";
import { withDuration } from "@/lib/webm";

function vint(id: number[]): number[] {
  return id;
}

function streamingWebm(): Uint8Array {
  const ebml = [0x1a, 0x45, 0xdf, 0xa3, 0x84, 0x01, 0x02, 0x03, 0x04];
  const timecodeScale = [0x2a, 0xd7, 0xb1, 0x83, 0x0f, 0x42, 0x40];
  const writingApp = [0x57, 0x41, 0x84, 0x74, 0x65, 0x73, 0x74];
  const infoBody = [...timecodeScale, ...writingApp];
  const info = [
    ...vint([0x15, 0x49, 0xa9, 0x66]),
    0x80 | infoBody.length,
    ...infoBody,
  ];
  const cluster = [0x1f, 0x43, 0xb6, 0x75, 0xff, 0xaa, 0xbb, 0xcc];
  const segment = [0x18, 0x53, 0x80, 0x67, 0xff, ...info, ...cluster];

  return new Uint8Array([...ebml, ...segment]);
}

function findDuration(bytes: Uint8Array): number | null {
  for (let at = 0; at < bytes.length - 10; at += 1) {
    if (bytes[at] === 0x44 && bytes[at + 1] === 0x89 && bytes[at + 2] === 0x88) {
      return new DataView(bytes.buffer, bytes.byteOffset).getFloat64(at + 3);
    }
  }

  return null;
}

describe("duração do webm gravado", () => {
  it("o arquivo do MediaRecorder nasce sem duração", () => {
    expect(findDuration(streamingWebm())).toBeNull();
  });

  it("escreve a duração real em milissegundos", async () => {
    const original = new Blob([streamingWebm() as BlobPart], { type: "audio/webm" });
    const fixed = await withDuration(original, 12000);
    const bytes = new Uint8Array(await fixed.arrayBuffer());

    expect(findDuration(bytes)).toBe(12000);
  });

  it("cresce exatamente os 11 bytes da duração", async () => {
    const original = new Blob([streamingWebm() as BlobPart], { type: "audio/webm" });
    const fixed = await withDuration(original, 5000);

    expect(fixed.size).toBe(original.size + 11);
  });

  it("mantém o áudio e o tipo intactos", async () => {
    const source = streamingWebm();
    const fixed = await withDuration(
      new Blob([source as BlobPart], { type: "audio/webm" }),
      3000,
    );
    const bytes = new Uint8Array(await fixed.arrayBuffer());

    expect(fixed.type).toBe("audio/webm");
    expect(bytes.subarray(bytes.length - 8)).toEqual(source.subarray(-8));
  });

  it("devolve o original quando não acha onde escrever", async () => {
    const solto = new Blob([new Uint8Array([1, 2, 3, 4, 5]) as BlobPart], {
      type: "audio/webm",
    });

    expect((await withDuration(solto, 1000)).size).toBe(5);
  });
});
