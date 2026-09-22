"use client";

import { copy } from "@/data/copy";
import { playSound } from "@/lib/sound";
import type { PlayMode } from "@/types/game";

function Crowd() {
  return (
    <svg viewBox="0 0 64 40" className="h-14 w-20" aria-hidden="true">
      <g stroke="var(--color-grape)" strokeWidth="3" strokeLinejoin="round">
        <circle cx="16" cy="13" r="7" fill="var(--color-lemon)" />
        <path d="M5 37c0-7 5-11 11-11s11 4 11 11z" fill="var(--color-lemon)" />
        <circle cx="46" cy="13" r="7" fill="var(--color-amber)" />
        <path d="M35 37c0-7 5-11 11-11s11 4 11 11z" fill="var(--color-amber)" />
      </g>
      <g fill="var(--color-grape)">
        <text x="28" y="12" fontSize="11" fontFamily="serif">
          ♪
        </text>
      </g>
    </svg>
  );
}

function Phones() {
  return (
    <svg viewBox="0 0 64 40" className="h-14 w-20" aria-hidden="true">
      <g stroke="var(--color-grape)" strokeWidth="3" strokeLinejoin="round">
        <rect
          x="4"
          y="6"
          width="18"
          height="28"
          rx="4"
          fill="var(--color-lemon)"
        />
        <rect
          x="42"
          y="6"
          width="18"
          height="28"
          rx="4"
          fill="var(--color-amber)"
        />
      </g>
      <g
        fill="none"
        stroke="var(--color-coral)"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="M26 20h4" />
        <path d="M34 20h4" />
      </g>
      <text
        x="27"
        y="14"
        fontSize="10"
        fontFamily="serif"
        fill="var(--color-grape)"
      >
        ♪
      </text>
    </svg>
  );
}

const cards: {
  mode: PlayMode;
  art: () => React.ReactElement;
  background: string;
}[] = [
  { mode: "local", art: Crowd, background: "bg-lemon" },
  { mode: "online", art: Phones, background: "bg-amber" },
];

export function ModePicker({
  onPick,
}: {
  onPick: (mode: PlayMode) => void;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <h2
        className="font-display text-grape text-center text-2xl uppercase leading-tight"
        style={{ animation: "rise-in 0.4s both" }}
      >
        {copy.modes.question}
      </h2>

      {cards.map((card, index) => {
        const text = copy.modes[card.mode];
        const Art = card.art;

        return (
          <button
            key={card.mode}
            type="button"
            onClick={() => {
              playSound("tap");
              onPick(card.mode);
            }}
            className={`stroke-hard hard-shadow-lg flex items-center gap-3 rounded-3xl px-4 py-4 text-left transition-transform duration-100 active:translate-x-[3px] active:translate-y-[3px] ${card.background}`}
            style={{ animation: `rise-in 0.45s ${0.1 + index * 0.1}s both` }}
          >
            <Art />
            <span className="flex flex-1 flex-col">
              <span className="font-display text-grape text-3xl uppercase leading-none">
                {text.title}
              </span>
              <span className="font-display text-grape mt-1 text-sm uppercase leading-tight opacity-80">
                {text.line}
              </span>
              <span className="text-grape mt-1.5 text-xs font-bold leading-snug opacity-75">
                {text.detail}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
