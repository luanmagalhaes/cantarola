"use client";

import { useState, type ReactNode } from "react";
import { api } from "@/lib/api/client";
import { copy } from "@/data/copy";
import { playSound } from "@/lib/sound";
import type { Song } from "@/types/game";

type LyricsPhase = "idle" | "loading" | "ready" | "missing";

function LyricsFold({ song }: { song: Song }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<LyricsPhase>("idle");
  const [lyrics, setLyrics] = useState("");

  async function load() {
    setPhase("loading");

    try {
      const { lyrics: found } = await api.lyrics(song.artist, song.title);

      if (found) {
        setLyrics(found);
        setPhase("ready");
      } else {
        setPhase("missing");
      }
    } catch {
      setPhase("missing");
    }
  }

  function toggle() {
    playSound("tap");
    setOpen((before) => !before);

    if (!open && phase === "idle") {
      void load();
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="font-display bg-gold stroke-thin rounded-lg px-3 py-1.5 text-xs uppercase"
      >
        {open ? `▴ ${copy.lyrics.hide}` : `▾ ${copy.lyrics.show}`}
      </button>

      {open ? (
        <div
          className="bg-cream stroke-thin scroll-area mt-2 max-h-44 overflow-y-auto overscroll-contain rounded-xl p-3 text-left"
          style={{ animation: "rise-in 0.25s both" }}
        >
          {phase === "ready" ? (
            <p className="whitespace-pre-line text-xs font-bold leading-relaxed">
              {lyrics}
            </p>
          ) : (
            <p className="text-center text-xs font-bold leading-snug opacity-75">
              {phase === "missing" ? copy.lyrics.missing : copy.lyrics.loading}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function NowSinging({
  song,
  number,
  onPreview,
  withLyrics = false,
  children,
}: {
  song: Song;
  number: number;
  onPreview?: () => void;
  withLyrics?: boolean;
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

      {withLyrics ? <LyricsFold key={song.id} song={song} /> : null}

      {children ? (
        <div className="mt-4 flex flex-col gap-2">{children}</div>
      ) : null}
    </div>
  );
}
