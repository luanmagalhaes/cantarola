"use client";

import { useState } from "react";
import { emojis } from "@/data/emojis";
import { playSound } from "@/lib/sound";
import type { ReactionTally } from "@/types/game";

export function ReactionBar({
  reactions,
  mine,
  canReact,
  onReact,
}: {
  reactions: ReactionTally[];
  mine: string | null;
  canReact: boolean;
  onReact: (emoji: string) => void;
}) {
  const [picking, setPicking] = useState(false);

  if (!canReact && reactions.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {reactions.map((entry) => (
        <button
          key={entry.emoji}
          type="button"
          disabled={!canReact}
          onClick={() => {
            playSound("tap");
            onReact(entry.emoji);
          }}
          className={`stroke-thin flex items-center gap-1 rounded-full px-2 py-0.5 text-sm ${
            entry.emoji === mine ? "bg-lemon" : "bg-cream"
          } ${canReact ? "" : "cursor-default"}`}
        >
          <span>{entry.emoji}</span>
          <span className="font-display text-grape text-xs">{entry.count}</span>
        </button>
      ))}

      {canReact ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              playSound("tap");
              setPicking((current) => !current);
            }}
            aria-label="Reagir a esse áudio"
            className="stroke-thin bg-cream text-grape rounded-full px-2 py-0.5 text-sm"
          >
            {mine ? "trocar" : "＋"}
          </button>

          {picking ? (
            <div
              className="bg-paper stroke-hard hard-shadow absolute bottom-full left-0 z-30 mb-1 flex gap-1 rounded-xl px-2 py-1.5"
              style={{ animation: "bounce-in 0.25s both" }}
            >
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    playSound("tap");
                    onReact(emoji);
                    setPicking(false);
                  }}
                  className={`rounded-lg px-1 text-xl ${
                    emoji === mine ? "bg-lemon" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
