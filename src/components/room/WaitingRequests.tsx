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
  waiting: PlayerRow[];
  players: PlayerRow[];
  onRefresh: () => void;
}

interface SeatSwap {
  waiting: PlayerRow;
  target: PlayerRow;
}

const teamSkins: Record<Team, string> = {
  red: "bg-team-red text-paper",
  blue: "bg-team-blue text-paper",
};

export function WaitingRequests({
  code,
  token,
  waiting,
  players,
  onRefresh,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [picking, setPicking] = useState<string | null>(null);
  const [swapping, setSwapping] = useState<SeatSwap | null>(null);

  if (waiting.length === 0) {
    return null;
  }

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

  function seatOwnerFor(person: PlayerRow): PlayerRow | null {
    const wanted = person.name.trim().toLowerCase();

    return (
      players.find((one) => one.name.trim().toLowerCase() === wanted) ?? null
    );
  }

  return (
    <div className="bg-gold stroke-hard hard-shadow w-full max-w-sm rounded-2xl p-3">
      <p className="font-display text-grape text-lg uppercase leading-tight">
        Querem entrar
      </p>

      {waiting.map((person) => {
        const owner = seatOwnerFor(person);
        const choosing = picking === person.id;

        return (
          <div key={person.id} className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Avatar
                name={person.name}
                photo={person.avatar}
                emoji={person.emoji}
                size="sm"
              />
              <span className="font-display text-grape text-lg uppercase leading-tight">
                {person.name}
              </span>
            </div>

            {owner ? (
              <p className="text-grape text-xs font-bold leading-snug">
                Já tem {owner.name} na sala. Se for a mesma pessoa voltando,
                devolva o lugar dela em vez de abrir outro.
              </p>
            ) : null}

            {choosing ? (
              <div className="bg-paper stroke-thin flex flex-col gap-1.5 rounded-xl p-2">
                <p className="font-display text-grape text-xs uppercase">
                  Quem é essa pessoa na sala?
                </p>
                {players.map((one) => (
                  <button
                    key={one.id}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setPicking(null);
                      setSwapping({ waiting: person, target: one });
                    }}
                    className="bg-cream stroke-thin flex items-center gap-2 rounded-lg px-2 py-1.5 text-left disabled:opacity-50"
                  >
                    <Avatar
                      name={one.name}
                      photo={one.avatar}
                      emoji={one.emoji}
                      size="sm"
                    />
                    <span className="font-display text-grape flex-1 text-sm uppercase">
                      {one.name}
                    </span>
                    {one.team ? (
                      <span
                        className={`font-display rounded-full px-2 py-0.5 text-[0.6rem] uppercase ${teamSkins[one.team]}`}
                      >
                        {copy.teams[one.team]}
                      </span>
                    ) : null}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPicking(null)}
                  className="font-display text-grape/70 py-1 text-xs uppercase"
                >
                  {copy.home.back}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {owner ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setSwapping({ waiting: person, target: owner })}
                    className="font-display bg-coral text-paper stroke-thin rounded-full px-3 py-1.5 text-xs uppercase disabled:opacity-50"
                  >
                    Devolver o lugar de {owner.name}
                  </button>
                ) : null}

                {(["red", "blue"] as Team[]).map((team) => (
                  <button
                    key={team}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(() =>
                        api.approveWaiting(code, token, person.id, team),
                      )
                    }
                    className={`font-display stroke-thin rounded-full px-3 py-1.5 text-xs uppercase disabled:opacity-50 ${teamSkins[team]}`}
                  >
                    Entra no {copy.teams[team]}
                  </button>
                ))}

                {players.length > 0 ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPicking(person.id)}
                    className="font-display bg-paper text-grape stroke-thin rounded-full px-3 py-1.5 text-xs uppercase disabled:opacity-50"
                  >
                    Trocar por quem já está
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(() => api.removePlayer(code, token, person.id))
                  }
                  className="font-display bg-paper text-grape stroke-thin rounded-full px-3 py-1.5 text-xs uppercase disabled:opacity-50"
                >
                  Recusar
                </button>
              </div>
            )}
          </div>
        );
      })}

      {problem ? (
        <p
          role="alert"
          className="bg-coral text-paper stroke-thin font-display mt-3 rounded-xl px-3 py-1.5 text-xs uppercase"
        >
          {problem}
        </p>
      ) : null}

      {swapping ? (
        <div className="bg-grape/85 fixed inset-0 z-[90] flex flex-col overflow-y-auto px-4 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))]">
          <div className="bg-paper stroke-hard hard-shadow m-auto flex w-full max-w-sm shrink-0 flex-col gap-3 rounded-2xl p-4 text-center">
            <p className="font-display text-grape text-xl uppercase leading-tight">
              Devolver o lugar de {swapping.target.name}?
            </p>
            <p className="text-grape text-sm font-bold leading-snug">
              {swapping.waiting.name} assume o lugar de {swapping.target.name},
              com o mesmo time e os pontos que já fez. O nome na sala continua{" "}
              {swapping.target.name} e o aparelho antigo perde o controle.
            </p>
            <Button
              color="coral"
              disabled={busy}
              onClick={() => {
                const swap = swapping;

                setSwapping(null);
                void run(() =>
                  api.restoreSeat(
                    code,
                    token,
                    swap.waiting.id,
                    swap.target.id,
                  ),
                );
              }}
            >
              Pode devolver
            </Button>
            <Button color="paper" disabled={busy} onClick={() => setSwapping(null)}>
              {copy.home.back}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
