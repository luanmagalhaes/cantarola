"use client";

import { useSyncExternalStore } from "react";
import {
  toggleMuted,
  subscribeMuted,
  readMuted,
  mutedOnServer,
  preloadSounds,
  playSound,
} from "@/lib/sound";

export function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, readMuted, mutedOnServer);

  return (
    <button
      type="button"
      aria-label={muted ? "Ligar o som" : "Desligar o som"}
      onClick={() => {
        toggleMuted();

        if (muted) {
          preloadSounds();
          playSound("tap");
        }
      }}
      className="bg-paper stroke-hard hard-shadow fixed right-3 top-[calc(0.75rem+var(--safe-top))] z-50 flex h-11 w-11 items-center justify-center rounded-full"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          d="M4 9h3.5L12 5v14l-4.5-4H4z"
          fill="var(--color-grape)"
          stroke="var(--color-grape)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {muted ? (
          <g
            stroke="var(--color-coral)"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M16 9.5l4.5 5" />
            <path d="M20.5 9.5l-4.5 5" />
          </g>
        ) : (
          <g
            fill="none"
            stroke="var(--color-grape)"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M16 9a4 4 0 0 1 0 6" />
            <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
          </g>
        )}
      </svg>
    </button>
  );
}
