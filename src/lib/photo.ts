const outputSide = 320;
const quality = 0.82;

export interface CropBox {
  x: number;
  y: number;
  size: number;
}

export interface CropView {
  naturalWidth: number;
  naturalHeight: number;
  frame: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface CropFrame {
  left: number;
  top: number;
  width: number;
  height: number;
  limitX: number;
  limitY: number;
  box: CropBox;
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

export function cropFrameFor(view: CropView): CropFrame {
  const base = view.frame / Math.max(1, Math.min(view.naturalWidth, view.naturalHeight));
  const scale = base * view.zoom;
  const width = view.naturalWidth * scale;
  const height = view.naturalHeight * scale;
  const limitX = Math.max(0, (width - view.frame) / 2);
  const limitY = Math.max(0, (height - view.frame) / 2);
  const left = (view.frame - width) / 2 + clamp(view.offsetX, -limitX, limitX);
  const top = (view.frame - height) / 2 + clamp(view.offsetY, -limitY, limitY);

  return {
    left,
    top,
    width,
    height,
    limitX,
    limitY,
    box: { x: -left / scale, y: -top / scale, size: view.frame / scale },
  };
}

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

export function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não consegui abrir essa foto. Tente outra."));
    };

    image.src = url;
  });
}

export function cropToBlob(source: HTMLImageElement, box: CropBox): Promise<Blob> {
  const canvas = document.createElement("canvas");

  canvas.width = outputSide;
  canvas.height = outputSide;

  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    return Promise.reject(new Error("Não consegui preparar a foto neste aparelho."));
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, outputSide, outputSide);
  context.imageSmoothingQuality = "high";
  context.drawImage(source, box.x, box.y, box.size, box.size, 0, 0, outputSide, outputSide);

  if (looksBlank(context, outputSide)) {
    return Promise.reject(new Error("Não consegui ler essa foto. Tente outra."));
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Não consegui preparar a foto neste aparelho."))),
      "image/jpeg",
      quality,
    );
  });
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
