"use client";

import { useEffect, useRef, useState } from "react";
import { cropFrameFor, cropToBlob, readImage } from "@/lib/photo";

interface PhotoCropperProps {
  file: File;
  busy?: boolean;
  onCancel: () => void;
  onDone: (photo: Blob) => void;
}

const frame = 264;
const minZoom = 1;
const maxZoom = 4;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

export function PhotoCropper({ file, busy = false, onCancel, onDone }: PhotoCropperProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [trouble, setTrouble] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef({ distance: 0, zoom: 1 });

  useEffect(() => {
    let alive = true;

    readImage(file)
      .then((loaded) => {
        if (alive) {
          setImage(loaded);
        }
      })
      .catch((cause: Error) => {
        if (alive) {
          setTrouble(cause.message);
        }
      });

    return () => {
      alive = false;
    };
  }, [file]);

  const view = cropFrameFor({
    naturalWidth: image?.naturalWidth ?? frame,
    naturalHeight: image?.naturalHeight ?? frame,
    frame,
    zoom,
    offsetX: offset.x,
    offsetY: offset.y,
  });
  const { left, top, limitX, limitY } = view;

  const moveBy = (dx: number, dy: number) => {
    setOffset((current) => ({
      x: clamp(current.x + dx, -limitX, limitX),
      y: clamp(current.y + dy, -limitY, limitY),
    }));
  };

  const spread = (): number => {
    const [first, second] = [...pointers.current.values()];

    return first && second ? Math.hypot(first.x - second.x, first.y - second.y) : 0;
  };

  const startPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2) {
      pinch.current = { distance: spread(), zoom };
    }
  };

  const movePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);

    if (!previous) {
      return;
    }

    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size >= 2) {
      const distance = spread();

      if (pinch.current.distance > 0 && distance > 0) {
        setZoom(clamp((pinch.current.zoom * distance) / pinch.current.distance, minZoom, maxZoom));
      }

      return;
    }

    moveBy(event.clientX - previous.x, event.clientY - previous.y);
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);

    if (pointers.current.size < 2) {
      pinch.current = { distance: 0, zoom };
    }
  };

  const save = async () => {
    if (!image) {
      return;
    }

    try {
      onDone(await cropToBlob(image, view.box));
    } catch (cause) {
      setTrouble(cause instanceof Error ? cause.message : "Não consegui usar essa foto. Tente outra.");
    }
  };

  return (
    <div className="fixed inset-0 z-[62] flex items-end justify-center bg-grape/85 p-3 sm:items-center sm:p-4">
      <div className=" flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-[1.75rem] stroke-hard hard-shadow bg-paper">
        <div className="shrink-0 px-5 py-3 bg-gold text-grape">
          <span className="font-display block text-xl leading-tight">Ajeite a sua foto</span>
          <span className="block text-xs font-semibold opacity-80">
            Arraste para escolher o pedaço e dê zoom com dois dedos
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex justify-center">
            <div
              onPointerDown={startPointer}
              onPointerMove={movePointer}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
              onWheel={(event) => setZoom((current) => clamp(current - event.deltaY / 500, minZoom, maxZoom))}
              style={{ width: frame, height: frame }}
              className="relative touch-none overflow-hidden rounded-[1.25rem] stroke-hard bg-cream"
            >
              {image ? (
                <img
                  src={image.src}
                  alt=""
                  draggable={false}
                  style={{ position: "absolute", left, top, width: view.width, height: view.height, maxWidth: "none" }}
                  className="select-none"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-grape/60">
                  {trouble ? "Essa foto não abriu" : "Abrindo a foto..."}
                </span>
              )}
            </div>
          </div>

          <label className="mt-4 flex items-center gap-3">
            <span className="text-lg" aria-hidden="true">
              🔍
            </span>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              aria-label="Zoom da foto"
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-black/15 accent-[var(--color-coral)]"
            />
          </label>

          {trouble ? (
            <p role="alert" className="mt-3 rounded-2xl px-3 py-2 text-sm font-semibold stroke-thin bg-coral-soft text-grape">
              {trouble}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 px-5 pb-5 pt-3">
          <button
            type="button"
            disabled={busy || !image}
            onClick={save}
            className="font-display w-full cursor-pointer rounded-xl px-4 py-3 text-base disabled:opacity-50 stroke-thin bg-gold text-grape uppercase"
          >
            {busy ? "Mandando..." : "Usar essa foto"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="font-display mt-1 w-full cursor-pointer rounded-xl px-3 py-2 text-sm transition-colors text-grape/60 hover:text-grape"
          >
            Escolher outra
          </button>
        </div>
      </div>
    </div>
  );
}
