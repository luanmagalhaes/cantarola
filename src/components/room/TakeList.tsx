"use client";

import { useState } from "react";
import type { TakeView } from "@/lib/api/client";

export function TakeList({
  takes,
  canGuess,
  busy,
  onGuess,
}: {
  takes: TakeView[];
  canGuess: boolean;
  busy: boolean;
  onGuess: (takeId: string, body: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (takes.length === 0) {
    return (
      <div className="bg-paper stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-4 py-6 text-center">
        <p className="text-4xl" aria-hidden="true">
          🎧
        </p>
        <p className="font-display text-grape mt-2 text-xl uppercase leading-tight">
          Nenhum áudio ainda
        </p>
        <p className="mt-1 text-sm font-bold leading-snug opacity-75">
          Assim que chegar um, ele aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex w-full max-w-sm flex-col gap-2">
      {takes.map((take, index) => {
        const open = openId === take.id;

        return (
          <li
            key={take.id}
            className={`stroke-hard hard-shadow rounded-2xl px-3 py-2.5 ${
              take.solved ? "bg-mint text-paper" : "bg-paper text-grape"
            }`}
            style={{ animation: `card-in 0.35s ${index * 0.05}s both` }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-sm uppercase">
                Áudio {index + 1}
              </span>
              <span className="font-display text-xs uppercase opacity-75">
                {take.seconds}s
              </span>
            </div>

            <audio
              src={take.audioUrl}
              controls
              preload="none"
              className="mt-2 w-full"
            />

            {take.solved ? (
              <p className="font-display mt-2 text-sm uppercase leading-tight">
                {take.solvedByName} acertou
              </p>
            ) : canGuess ? (
              open ? (
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();

                    if (draft.trim().length < 2) {
                      return;
                    }

                    onGuess(take.id, draft.trim());
                    setDraft("");
                  }}
                >
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Nome da música"
                    maxLength={60}
                    autoFocus
                    className="bg-cream stroke-thin font-sans min-w-0 flex-1 rounded-lg px-3 py-2 text-base font-bold outline-none placeholder:opacity-40"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="font-display bg-coral text-paper stroke-thin rounded-lg px-3 py-2 text-sm uppercase disabled:opacity-50"
                  >
                    Vai
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(take.id);
                    setDraft("");
                  }}
                  className="font-display bg-gold text-grape stroke-thin mt-2 w-full rounded-lg px-2 py-1.5 text-sm uppercase"
                >
                  Chutar essa
                </button>
              )
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
