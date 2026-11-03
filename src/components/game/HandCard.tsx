"use client";

import { useState, type ReactNode } from "react";
import { copy } from "@/data/copy";
import { playSound } from "@/lib/sound";
import type { Song } from "@/types/game";

export function HandCard({
  song,
  lyrics,
  children,
}: {
  song: Song;
  lyrics: string | null | undefined;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li
      className="bg-paper stroke-hard hard-shadow text-grape w-full rounded-2xl px-3 py-3 text-center"
      style={{ animation: "card-in 0.3s both" }}
    >
      <p className="font-display pb-1 text-xl uppercase leading-tight">
        {song.title}
      </p>
      <p className="text-xs font-bold uppercase opacity-75">{song.artist}</p>
      <p className="mt-1 text-xs font-bold italic opacity-60">“{song.hint}”</p>

      <button
        type="button"
        onClick={() => {
          playSound("tap");
          setOpen((before) => !before);
        }}
        aria-expanded={open}
        className="font-display bg-gold stroke-thin mt-2 rounded-lg px-3 py-1 text-[11px] uppercase"
      >
        {open ? `▴ ${copy.lyrics.hide}` : `▾ ${copy.lyrics.show}`}
      </button>

      {open ? (
        <div className="bg-cream stroke-thin scroll-area mt-2 max-h-36 overflow-y-auto overscroll-contain rounded-xl p-3 text-left">
          {typeof lyrics === "string" ? (
            <p className="whitespace-pre-line text-xs font-bold leading-relaxed">
              {lyrics}
            </p>
          ) : (
            <p className="text-center text-xs font-bold leading-snug opacity-75">
              {lyrics === null ? copy.lyrics.missing : copy.lyrics.loading}
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-2 flex flex-col gap-1.5">{children}</div>
    </li>
  );
}
