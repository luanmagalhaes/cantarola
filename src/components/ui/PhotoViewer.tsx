"use client";

import { useEffect } from "react";

interface PhotoViewerProps {
  name: string;
  photo: string;
  onClose: () => void;
}

export function PhotoViewer({ name, photo, onClose }: PhotoViewerProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label={`Foto de ${name}`}
      onClick={onClose}
      className="fixed inset-0 z-[64] flex items-center justify-center bg-grape/85 p-5"
    >
      <div className=" flex max-w-xs flex-col items-center gap-3">
        <span className="overflow-hidden rounded-[1.75rem] p-1.5 stroke-hard hard-shadow bg-paper">
          <img
            src={photo}
            alt={`Foto de ${name}`}
            className="block h-auto w-full max-w-[16rem] rounded-[1.25rem] object-cover"
          />
        </span>
        <span className="font-display rounded-xl px-4 py-1.5 text-center text-lg leading-tight stroke-thin bg-paper text-grape">
          {name}
        </span>
        <span className="text-xs font-semibold text-white/70">Toque para fechar</span>
      </div>
    </div>
  );
}
