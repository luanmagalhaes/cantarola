"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Spot {
  x: number;
  y: number;
}

const edge = 8;
const slop = 4;

export function useDraggable(initial: Spot) {
  const [spot, setSpot] = useState<Spot>(initial);
  const dragging = useRef(false);
  const moved = useRef(false);
  const from = useRef<Spot>({ x: 0, y: 0 });
  const base = useRef<Spot>(initial);
  const root = useRef<HTMLElement | null>(null);
  const size = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const measure = useCallback(() => {
    if (!root.current) {
      return;
    }

    const rect = root.current.getBoundingClientRect();

    size.current = { width: rect.width, height: rect.height };
  }, []);

  const clamp = useCallback((next: Spot): Spot => {
    const view = window.visualViewport;
    const across = view?.width ?? window.innerWidth;
    const down = view?.height ?? window.innerHeight;
    const width = size.current.width || 280;
    const height = size.current.height || 200;
    const maxX = Math.max(edge, across - width - edge);
    const maxY = Math.max(edge, down - height - edge);

    return {
      x: Math.min(maxX, Math.max(edge, next.x)),
      y: Math.min(maxY, Math.max(edge, next.y)),
    };
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const box = event.currentTarget.closest("[data-drag-root]") as HTMLElement | null;

      if (!box) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const control = target?.closest("button, input, textarea, select, a, audio");

      if (control && control !== event.currentTarget) {
        return;
      }

      const rect = box.getBoundingClientRect();

      size.current = { width: rect.width, height: rect.height };
      base.current = { x: rect.left, y: rect.top };
      from.current = { x: event.clientX, y: event.clientY };
      dragging.current = true;
      moved.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!dragging.current) {
        return;
      }

      const shiftX = event.clientX - from.current.x;
      const shiftY = event.clientY - from.current.y;

      if (Math.abs(shiftX) > slop || Math.abs(shiftY) > slop) {
        moved.current = true;
      }

      setSpot(clamp({ x: base.current.x + shiftX, y: base.current.y + shiftY }));
    },
    [clamp],
  );

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLElement>) => {
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const settle = useCallback(() => {
    measure();
    setSpot((current) => clamp(current));
  }, [clamp, measure]);

  useEffect(() => {
    const view = window.visualViewport;

    window.addEventListener("resize", settle);
    view?.addEventListener("resize", settle);

    return () => {
      window.removeEventListener("resize", settle);
      view?.removeEventListener("resize", settle);
    };
  }, [settle]);

  const attach = useCallback(
    (node: HTMLElement | null) => {
      root.current = node;

      if (node) {
        measure();
      }
    },
    [measure],
  );

  return {
    spot,
    attach,
    settle,
    justDragged: () => moved.current,
    handles: { onPointerDown, onPointerMove, onPointerUp },
  };
}
