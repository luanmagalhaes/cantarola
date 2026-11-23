"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { copy } from "@/data/copy";
import { api } from "@/lib/api/client";
import { playSound } from "@/lib/sound";
import type { PlayerRow, Team } from "@/types/game";

interface Props {
  code: string;
  token: string;
  players: PlayerRow[];
  meId: string;
  onRefresh: () => void;
  onClose: () => void;
}

const teamSkins: Record<Team, string> = {
  red: "bg-team-red text-paper",
  blue: "bg-team-blue text-paper",
};

function otherTeam(team: Team | null): Team {
  return team === "red" ? "blue" : "red";
}

export function CrewPanel({
  code,
  token,
  players,
  meId,
  onRefresh,
  onClose,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [removing, setRemoving] = useState<PlayerRow | null>(null);

  async function run(action: () => Promise<unknown>) {
    if (busy) {
      return;
    }

    setBusy(true);
    setProblem("");
    playSound("tap");

    try {
      await action();
      onRefresh();
    } catch (cause) {
      setProblem(cause instanceof Error ? cause.message : copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-grape/85 fixed inset-0 z-[90] flex flex-col overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))]">
      <div className="bg-paper stroke-hard hard-shadow m-auto flex w-full max-w-sm shrink-0 flex-col gap-3 rounded-2xl p-4">
        <p className="font-display text-grape text-center text-xl uppercase leading-tight">
          Quem está na sala
        </p>
        <p className="text-grape text-center text-xs font-bold leading-snug opacity-80">
          Dá para trocar de time ou tirar alguém a qualquer momento, com a
          partida rolando ou não.
        </p>

        {players.map((person) => (
          <div
            key={person.id}
            className="bg-cream stroke-thin flex flex-col gap-2 rounded-xl p-2"
          >
            <div className="flex items-center gap-2">
              <Avatar
                name={person.name}
                photo={person.avatar}
                emoji={person.emoji}
                size="sm"
              />
              <span className="font-display text-grape min-w-0 flex-1 break-words text-sm uppercase leading-tight">
                {person.name}
                {person.id === meId ? " (você)" : ""}
              </span>
              {person.team ? (
                <span
                  className={`font-display rounded-full px-2 py-0.5 text-[0.6rem] uppercase ${teamSkins[person.team]}`}
                >
                  {copy.teams[person.team]}
                </span>
              ) : (
                <span className="font-display text-grape/60 text-[0.6rem] uppercase">
                  sem time
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    api.movePlayer(
                      code,
                      token,
                      person.id,
                      otherTeam(person.team),
                    ),
                  )
                }
                className={`font-display stroke-thin rounded-full px-3 py-1.5 text-xs uppercase disabled:opacity-50 ${teamSkins[otherTeam(person.team)]}`}
              >
                Passar para o {copy.teams[otherTeam(person.team)]}
              </button>

              {person.id === meId ? null : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setRemoving(person)}
                  className="font-display bg-paper text-grape stroke-thin rounded-full px-3 py-1.5 text-xs uppercase disabled:opacity-50"
                >
                  Tirar da sala
                </button>
              )}
            </div>
          </div>
        ))}

        {problem ? (
          <p
            role="alert"
            className="bg-coral text-paper stroke-thin font-display rounded-xl px-3 py-1.5 text-xs uppercase"
          >
            {problem}
          </p>
        ) : null}

        <Button color="paper" disabled={busy} onClick={onClose}>
          Fechar
        </Button>
      </div>

      {removing ? (
        <div className="bg-grape/90 fixed inset-0 z-[95] flex flex-col overflow-y-auto px-4 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))]">
          <div className="bg-paper stroke-hard hard-shadow m-auto flex w-full max-w-sm shrink-0 flex-col gap-3 rounded-2xl p-4 text-center">
            <p className="font-display text-grape text-xl uppercase leading-tight">
              Tirar {removing.name} da sala?
            </p>
            <p className="text-grape text-sm font-bold leading-snug">
              A pessoa sai na hora. Para voltar, precisa entrar de novo com o
              código da sala.
            </p>
            <Button
              color="coral"
              disabled={busy}
              onClick={() => {
                const target = removing;

                setRemoving(null);
                void run(() => api.removePlayer(code, token, target.id));
              }}
            >
              Pode tirar
            </Button>
            <Button
              color="paper"
              disabled={busy}
              onClick={() => setRemoving(null)}
            >
              {copy.home.back}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
