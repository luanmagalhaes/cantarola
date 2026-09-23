const segmentId = 0x18538067;
const infoId = 0x1549a966;
const durationBytes = 11;
const maxShortSize = 0x7e;

interface Element {
  id: number;
  bodyAt: number;
  size: number;
  sizeAt: number;
  sizeLength: number;
  unknownSize: boolean;
}

function readVint(view: Uint8Array, at: number) {
  const first = view[at];
  let length = 1;
  let mask = 0x80;

  while (length <= 8 && (first & mask) === 0) {
    mask >>= 1;
    length += 1;
  }

  let raw = 0;

  for (let step = 0; step < length; step += 1) {
    raw = raw * 256 + view[at + step];
  }

  const value = raw % Math.pow(2, 7 * length);

  return { value, length, raw };
}

function readElement(view: Uint8Array, at: number): Element | null {
  if (at + 2 > view.length) {
    return null;
  }

  const id = readVint(view, at);
  const size = readVint(view, at + id.length);
  const sizeAt = at + id.length;

  return {
    id: id.raw,
    bodyAt: sizeAt + size.length,
    size: size.value,
    sizeAt,
    sizeLength: size.length,
    unknownSize: size.value === Math.pow(2, 7 * size.length) - 1,
  };
}

function findInfo(view: Uint8Array): Element | null {
  let at = 0;

  while (at < view.length) {
    const element = readElement(view, at);

    if (!element) {
      return null;
    }

    if (element.id === infoId) {
      return element;
    }

    if (element.id === segmentId) {
      at = element.bodyAt;
      continue;
    }

    if (element.unknownSize) {
      return null;
    }

    at = element.bodyAt + element.size;
  }

  return null;
}

export async function withDuration(blob: Blob, ms: number): Promise<Blob> {
  try {
    const view = new Uint8Array(await blob.arrayBuffer());
    const info = findInfo(view);

    if (
      !info ||
      info.unknownSize ||
      info.sizeLength !== 1 ||
      info.size + durationBytes > maxShortSize
    ) {
      return blob;
    }

    const duration = new Uint8Array(durationBytes);

    duration[0] = 0x44;
    duration[1] = 0x89;
    duration[2] = 0x88;
    new DataView(duration.buffer).setFloat64(3, ms);

    const patched = new Uint8Array(view.length + durationBytes);

    patched.set(view.subarray(0, info.bodyAt));
    patched.set(duration, info.bodyAt);
    patched.set(view.subarray(info.bodyAt), info.bodyAt + durationBytes);
    patched[info.sizeAt] = 0x80 | (info.size + durationBytes);

    return new Blob([patched], { type: blob.type });
  } catch {
    return blob;
  }
}
