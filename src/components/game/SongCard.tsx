"use client";

import type { ReactNode } from "react";
import type { Outcome, Song } from "@/types/game";

const outcomeStyles: Record<Outcome, { background: string; label: string }> = {
  hit: { background: "bg-mint text-paper", label: "acertou" },
  stolen: { background: "bg-team-blue text-paper", label: "roubada" },
  missed: { background: "bg-grape/30 text-grape", label: "passou" },
};

export function SongCard({
  song,
  outcome,
  index,
  isBomb,
  actions,
}: {
  song: Song | null;
  outcome: Outcome | null;
  index: number;
  isBomb?: boolean;
  actions?: ReactNode;
}) {
  const settled = outcome !== null;
  const style = outcome ? outcomeStyles[outcome] : null;

  return (
    <li
      className={`stroke-hard hard-shadow relative rounded-2xl px-3 py-2.5 ${
        style ? style.background : "bg-paper text-grape"
      }`}
      style={{ animation: `card-in 0.35s ${index * 0.05}s both` }}
    >
      {isBomb && settled ? (
        <span className="bg-gold stroke-thin font-display text-grape absolute -right-2 -top-3 rounded-lg px-2 py-0.5 text-[10px] uppercase">
          bomba ×2
        </span>
      ) : null}

      {song ? (
        <>
          <p
            className={`font-display text-lg uppercase leading-tight ${
              settled ? "line-through opacity-80" : ""
            }`}
          >
            {song.title}
          </p>
          <p className="text-xs font-bold uppercase opacity-75">
            {song.artist}
          </p>
          {settled ? null : (
            <p className="mt-0.5 text-xs font-bold italic opacity-60">
              “{song.hint}”
            </p>
          )}
        </>
      ) : (
        <p className="font-display text-lg uppercase leading-tight opacity-60">
          Música {index + 1}
        </p>
      )}

      {style ? (
        <p className="font-display mt-1 text-xs uppercase tracking-wider">
          {style.label}
        </p>
      ) : null}

      {actions ? <div className="mt-2 flex gap-2">{actions}</div> : null}
    </li>
  );
}
