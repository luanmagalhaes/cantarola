const maxSide = 320;
const quality = 0.82;

function looksBlank(context: CanvasRenderingContext2D, side: number): boolean {
  const { data } = context.getImageData(0, 0, side, side);
  const first = [data[0], data[1], data[2]];

  for (let at = 4; at < data.length; at += 4) {
    if (
      Math.abs(data[at] - first[0]) > 6 ||
      Math.abs(data[at + 1] - first[1]) > 6 ||
      Math.abs(data[at + 2] - first[2]) > 6
    ) {
      return false;
    }
  }

  return true;
}

export async function shrinkPhoto(file: File): Promise<string> {
  const source = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const width = Math.round(source.width * scale);
  const height = Math.round(source.height * scale);
  const side = Math.min(width, height);
  const canvas = document.createElement("canvas");

  canvas.width = side;
  canvas.height = side;

  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    source.close();

    throw new Error("Não consegui preparar a foto neste aparelho.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, side, side);

  context.drawImage(
    source,
    (width - side) / 2 / scale,
    (height - side) / 2 / scale,
    side / scale,
    side / scale,
    0,
    0,
    side,
    side,
  );

  source.close();

  if (looksBlank(context, side)) {
    throw new Error("Não consegui ler essa foto. Tente outra.");
  }

  return canvas.toDataURL("image/jpeg", quality);
}

export async function shrinkToBlob(file: File): Promise<Blob> {
  const dataUrl = await shrinkPhoto(file);
  const answer = await fetch(dataUrl);

  return answer.blob();
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
