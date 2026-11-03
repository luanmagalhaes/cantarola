"use client";

import type { ReactNode } from "react";
import { copy } from "@/data/copy";
import { playSound } from "@/lib/sound";
import type { Song } from "@/types/game";

export function NowSinging({
  song,
  number,
  onPreview,
  children,
}: {
  song: Song;
  number: number;
  onPreview?: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      className="bg-paper stroke-hard hard-shadow-lg text-grape w-full max-w-sm rounded-3xl px-4 pb-4 pt-5 text-center"
      style={{ animation: "card-in 0.35s both" }}
    >
      <p className="font-display text-xs uppercase tracking-wider opacity-60">
        Música {number}
      </p>
      <p className="font-display mt-1 pb-1 text-3xl uppercase leading-tight">
        {song.title}
      </p>
      <p className="text-sm font-bold uppercase opacity-75">{song.artist}</p>
      <p className="mt-2 text-sm font-bold italic opacity-60">“{song.hint}”</p>

      {onPreview ? (
        <button
          type="button"
          onClick={() => {
            playSound("tap");
            onPreview();
          }}
          className="font-display bg-gold stroke-thin mt-3 rounded-lg px-3 py-1.5 text-xs uppercase"
        >
          ♪ {copy.preview.button}
        </button>
      ) : null}

      {children ? (
        <div className="mt-4 flex flex-col gap-2">{children}</div>
      ) : null}
    </div>
  );
}
