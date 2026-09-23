"use client";

import { useState } from "react";
import { ReactionBar } from "@/components/room/ReactionBar";
import type { TakeView } from "@/lib/api/client";

export interface GuessFeedback {
  takeId: string;
  correct: boolean;
  message: string;
}

export function TakeList({
  takes,
  canGuess,
  busy,
  onGuess,
  feedback,
  canReact = false,
  onReact,
}: {
  takes: TakeView[];
  canGuess: boolean;
  busy: boolean;
  onGuess: (takeId: string, body: string) => void;
  feedback?: GuessFeedback | null;
  canReact?: boolean;
  onReact?: (takeId: string, emoji: string) => void;
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
        const miss =
          feedback && feedback.takeId === take.id && !feedback.correct
            ? feedback
            : null;

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
              preload="auto"
              className="mt-2 w-full"
              onLoadedMetadata={(event) => {
                const player = event.currentTarget;

                if (player.currentTime > 0.05) {
                  player.currentTime = 0;
                }
              }}
            />

            <ReactionBar
              reactions={take.reactions}
              mine={take.myReaction}
              canReact={canReact && Boolean(onReact)}
              onReact={(emoji) => onReact?.(take.id, emoji)}
            />

            {take.solved ? (
              <p className="font-display mt-2 text-sm uppercase leading-tight">
                {take.solvedByName} acertou
              </p>
            ) : canGuess ? (
              <>
                {open ? (
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();

                      if (draft.trim().length < 2) {
                        return;
                      }

                      onGuess(take.id, draft.trim());
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
                      {busy ? "..." : "Vai"}
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
                )}

                {miss ? (
                  <p
                    role="status"
                    className="font-display bg-coral text-paper stroke-thin mt-2 rounded-lg px-3 py-2 text-center text-sm uppercase leading-snug"
                    style={{ animation: "shake 0.4s both" }}
                  >
                    {miss.message}
                  </p>
                ) : null}
              </>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
