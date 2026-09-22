"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { MatchSheet } from "@/components/history/MatchSheet";
import { api } from "@/lib/api/client";
import { copy } from "@/data/copy";
import {
  availableMonths,
  currentMonth,
  matchesInMonth,
  monthLabel,
  ranking,
  shortDate,
} from "@/lib/game/history";
import type { MatchPlayer, MatchRow, Team } from "@/types/game";

const teamColors: Record<Team, string> = {
  red: "bg-team-red",
  blue: "bg-team-blue",
};

const medals = ["🥇", "🥈", "🥉"];
const visibleNames = 3;

function summarizeNames(people: readonly MatchPlayer[]): string {
  if (people.length === 0) {
    return "—";
  }

  const shown = people.slice(0, visibleNames).map((person) => person.name);
  const rest = people.length - shown.length;

  return rest > 0 ? `${shown.join(", ")} +${rest}` : shown.join(", ");
}

export function HistoryScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [openMatch, setOpenMatch] = useState<MatchRow | null>(null);

  useEffect(() => {
    const load = setTimeout(() => {
      void api
        .history()
        .then((response) => setMatches(response.matches))
        .catch((failure: unknown) =>
          setError(
            failure instanceof Error ? failure.message : copy.errors.generic,
          ),
        );
    }, 0);

    return () => clearTimeout(load);
  }, []);

  const months = matches ? availableMonths(matches) : [];
  const selectedMonth = months.includes(month) ? month : (months[0] ?? month);
  const monthMatches = matches ? matchesInMonth(matches, selectedMonth) : [];
  const table = ranking(monthMatches);

  return (
    <main className="confetti-dots bg-cream flex min-h-dvh flex-col items-center gap-5 px-5 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))]">
      <SoundToggle />

      <div style={{ animation: "rise-in 0.4s both" }}>
        <Wordmark size="sm" withTagline={false} />
      </div>

      <h1 className="font-display text-lemon outline-text text-center text-4xl uppercase leading-none">
        Histórico
      </h1>

      {matches === null && !error ? (
        <p className="font-display text-grape text-lg uppercase">Carregando</p>
      ) : null}

      {error ? (
        <p className="bg-coral text-paper stroke-hard hard-shadow font-display w-full max-w-sm rounded-2xl px-4 py-3 text-center uppercase">
          {error}
        </p>
      ) : null}

      {matches !== null && matches.length === 0 ? (
        <div className="bg-paper stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-4 py-6 text-center">
          <p className="font-display text-xl uppercase">
            Nenhuma partida ainda
          </p>
          <p className="mt-1 text-sm font-bold opacity-70">
            Termine uma partida que ela aparece aqui.
          </p>
        </div>
      ) : null}

      {months.length > 1 ? (
        <div className="flex w-full max-w-sm flex-wrap justify-center gap-1.5">
          {months.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMonth(item)}
              className={`font-display stroke-thin rounded-lg px-2 py-1 text-xs uppercase ${
                item === selectedMonth
                  ? "bg-grape text-lemon"
                  : "bg-paper text-grape"
              }`}
            >
              {monthLabel(item)}
            </button>
          ))}
        </div>
      ) : null}

      {table.length > 0 ? (
        <section className="w-full max-w-sm">
          <h2 className="font-display text-grape mb-2 text-lg uppercase">
            Quem mais ganhou em {monthLabel(selectedMonth)}
          </h2>
          <ol className="flex flex-col gap-1.5">
            {table.map((row, position) => (
              <li
                key={row.name}
                className={`stroke-hard hard-shadow flex items-center gap-2 rounded-2xl px-3 py-2 ${
                  position === 0 ? "bg-coral text-paper" : "bg-paper text-grape"
                }`}
                style={{ animation: `rise-in 0.35s ${position * 0.05}s both` }}
              >
                <span className="font-display w-7 text-center text-lg leading-none">
                  {medals[position] ?? position + 1}
                </span>
                <span className="font-display flex-1 text-lg uppercase leading-none">
                  {row.name}
                </span>
                <span className="text-right text-xs font-bold leading-tight">
                  {row.wins} {row.wins === 1 ? "vitória" : "vitórias"}
                  <br />
                  <span className="opacity-70">
                    {row.matches} {row.matches === 1 ? "jogo" : "jogos"} ·{" "}
                    {row.points} {row.points === 1 ? "ponto" : "pontos"}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {monthMatches.length > 0 ? (
        <section className="w-full max-w-sm">
          <h2 className="font-display text-grape mb-2 text-lg uppercase">
            As partidas ({monthMatches.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {monthMatches.map((match) => {
              const redSquad = match.players.filter(
                (person) => person.team === "red",
              );
              const blueSquad = match.players.filter(
                (person) => person.team === "blue",
              );

              return (
                <li key={match.id}>
                  <button
                    type="button"
                    onClick={() => setOpenMatch(match)}
                    className="bg-paper stroke-hard hard-shadow w-full rounded-2xl p-2 text-left transition-transform duration-100 active:translate-x-[2px] active:translate-y-[2px]"
                  >
                    <div className="flex items-center justify-between px-1">
                      <span className="font-display text-xs uppercase opacity-70">
                        {shortDate(match.finished_at)} · sala {match.room_code}
                      </span>
                      <span className="font-display text-xs uppercase opacity-70">
                        {match.winner === "tie"
                          ? "empate"
                          : `venceu o ${copy.teams[match.winner ?? "tie"]}`}
                      </span>
                    </div>

                    <div className="mt-1.5 grid grid-cols-2 items-stretch gap-1.5">
                      {(
                        [
                          ["red", redSquad, match.score_red],
                          ["blue", blueSquad, match.score_blue],
                        ] as const
                      ).map(([team, people, points]) => (
                        <div
                          key={team}
                          className={`stroke-thin flex flex-col gap-1 rounded-xl p-1.5 ${
                            teamColors[team]
                          } ${match.winner === team ? "" : "opacity-70"}`}
                        >
                          <span className="font-display text-paper pb-0.5 text-center text-2xl leading-tight">
                            {points}
                          </span>
                          <span className="text-paper text-center text-[11px] font-bold leading-tight">
                            {summarizeNames(people)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="font-display mt-1 text-center text-[10px] uppercase opacity-50">
                      toque para ver a partida
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="w-full max-w-sm">
        <Button color="grape" onClick={() => router.push("/")}>
          Voltar
        </Button>
      </div>

      {openMatch ? (
        <MatchSheet match={openMatch} onClose={() => setOpenMatch(null)} />
      ) : null}
    </main>
  );
}
