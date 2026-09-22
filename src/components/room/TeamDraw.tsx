"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { copy } from "@/data/copy";
import { playSound } from "@/lib/sound";
import type { PlayerRow, Team } from "@/types/game";

const backgrounds: Record<Team, string> = {
  red: "bg-team-red",
  blue: "bg-team-blue",
};

export function TeamDraw({
  players,
  onClose,
}: {
  players: PlayerRow[];
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"spinning" | "revealing">("spinning");

  useEffect(() => {
    playSound("draw");

    const timer = setTimeout(() => setPhase("revealing"), 1700);

    return () => clearTimeout(timer);
  }, []);

  const squadOf = (team: Team) =>
    players.filter((player) => player.team === team);

  return (
    <div className="bg-grape/90 fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 px-5">
      <h2
        className="font-display text-lemon outline-text text-center text-4xl uppercase leading-none"
        style={{ animation: "stamp-in 0.5s both" }}
      >
        {phase === "spinning" ? "Sorteando" : "Deu nisso aí"}
      </h2>

      {phase === "spinning" ? (
        <div className="flex max-w-sm flex-wrap justify-center gap-2">
          {players.map((player, index) => (
            <span
              key={player.id}
              className="font-display text-paper stroke-hard rounded-xl px-3 py-2 text-lg uppercase"
              style={{ animation: `team-flash 0.42s ${index * 0.07}s infinite` }}
            >
              {player.name}
            </span>
          ))}
        </div>
      ) : (
        <div className="grid w-full max-w-sm grid-cols-2 items-stretch gap-2">
          {(["red", "blue"] as const).map((team, column) => (
            <div
              key={team}
              className={`stroke-hard hard-shadow flex flex-col gap-2 rounded-2xl p-2 ${backgrounds[team]}`}
              style={{ animation: `column-in 0.45s ${column * 0.12}s both` }}
            >
              <div className="text-center">
                <p className="font-display text-paper pb-1 text-sm uppercase leading-none">
                  Time {copy.teams[team]}
                </p>
                <p className="font-display text-paper outline-text-thin pb-1 text-3xl leading-tight">
                  {squadOf(team).length}
                </p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {squadOf(team).map((player, index) => (
                  <li
                    key={player.id}
                    className="bg-paper stroke-thin font-display rounded-lg px-2 py-1.5 text-center text-sm uppercase leading-none"
                    style={{
                      animation: `name-reveal 0.35s ${0.25 + index * 0.1}s both`,
                    }}
                  >
                    {player.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {phase === "revealing" ? (
        <div
          className="w-full max-w-sm"
          style={{ animation: "rise-in 0.4s 0.6s both" }}
        >
          <Button color="lemon" onClick={onClose}>
            Fechar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
