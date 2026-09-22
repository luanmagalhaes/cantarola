"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { copy } from "@/data/copy";
import { playSound } from "@/lib/sound";
import type { DeckMode, MatchRow, Team } from "@/types/game";

const backgrounds: Record<Team, string> = {
  red: "bg-team-red",
  blue: "bg-team-blue",
};

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MatchSheet({
  match,
  onClose,
}: {
  match: MatchRow;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const deckName =
    copy.decks[match.deck_mode as DeckMode]?.name ?? match.deck_mode;

  return (
    <div
      className="fixed inset-0 z-[68] flex items-end justify-center p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Partida da sala ${match.room_code}`}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => {
          playSound("tap");
          onClose();
        }}
        className="bg-grape/85 absolute inset-0 cursor-default"
      />

      <div
        className="bg-cream stroke-hard relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-3xl shadow-[0_12px_0_var(--color-grape)]"
        style={{ animation: "bounce-in 0.4s both" }}
      >
        <div className="bg-lemon confetti-dots border-grape shrink-0 border-b-4 px-4 py-3 text-center">
          <p className="font-display text-xs uppercase tracking-[0.2em] opacity-70">
            sala {match.room_code} · {deckName}
          </p>
          <h2 className="font-display text-2xl uppercase leading-tight">
            {match.winner === "tie"
              ? "Deu empate"
              : `Venceu o ${copy.teams[match.winner ?? "tie"]}`}
          </h2>
          <p className="text-xs font-bold opacity-70">
            {longDate(match.finished_at)}
          </p>
        </div>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <div className="grid grid-cols-2 items-stretch gap-2">
            {(["red", "blue"] as const).map((team) => {
              const people = match.players.filter(
                (person) => person.team === team,
              );
              const points =
                team === "red" ? match.score_red : match.score_blue;

              return (
                <div
                  key={team}
                  className={`stroke-hard flex flex-col gap-2 rounded-2xl p-2 ${
                    backgrounds[team]
                  } ${match.winner === team ? "" : "opacity-80"}`}
                >
                  <div className="text-center">
                    <p className="font-display text-paper pb-1 text-xs uppercase leading-none">
                      Time {copy.teams[team]}
                    </p>
                    <p className="font-display text-paper outline-text-thin pb-1 text-3xl leading-tight">
                      {points}
                    </p>
                    <p className="text-paper text-[10px] font-bold uppercase opacity-80">
                      {people.length}{" "}
                      {people.length === 1 ? "pessoa" : "pessoas"}
                    </p>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {people.length === 0 ? (
                      <li className="border-paper/50 font-display text-paper/70 rounded-lg border-2 border-dashed px-2 py-1.5 text-center text-xs uppercase leading-none">
                        vazio
                      </li>
                    ) : (
                      people.map((person) => (
                        <li
                          key={person.name}
                          className="bg-paper stroke-thin font-display break-words rounded-lg px-2 py-1.5 text-center text-sm uppercase leading-none"
                        >
                          {person.name}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className="font-display mt-3 text-center text-xs uppercase opacity-70">
            {match.songs_played}{" "}
            {match.songs_played === 1 ? "música cantada" : "músicas cantadas"}
          </p>
        </div>

        <div className="border-grape/10 shrink-0 border-t-2 p-3">
          <Button color="grape" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
