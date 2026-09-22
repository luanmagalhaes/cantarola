"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TeamDraw } from "@/components/room/TeamDraw";
import { api, type RoomState } from "@/lib/api/client";
import { deckSizes } from "@/data/songs";
import { copy } from "@/data/copy";
import { canStart, minPlayers, withoutTeam } from "@/lib/game/rules";
import type { DeckMode, Team, Twist } from "@/types/game";

const deckOrder: DeckMode[] = ["national", "international", "mixed"];
const twistOrder: Twist[] = ["whistle", "hum", "bomb", "duel"];

const teamColors: Record<Team, string> = {
  red: "bg-team-red",
  blue: "bg-team-blue",
};

export function LobbyScreen({
  state,
  token,
  onHelp,
}: {
  state: RoomState;
  token: string;
  onHelp: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const previousWithoutTeam = useRef<number | null>(null);

  const { room, players, me } = state;
  const ready = canStart(players);
  const waiting = withoutTeam(players);
  const alreadyDrawn = waiting.length === 0 && players.length > 0;
  const activeTwists = room.twists ?? [];

  useEffect(() => {
    const previous = previousWithoutTeam.current;
    previousWithoutTeam.current = waiting.length;

    if (previous === null || previous === 0 || waiting.length > 0) {
      return;
    }

    const open = setTimeout(() => setShowDraw(true), 0);

    return () => clearTimeout(open);
  }, [waiting.length]);

  async function dispatch(action: () => Promise<unknown>) {
    try {
      setError("");
      await action();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : copy.errors.generic,
      );
    }
  }

  async function runDraw() {
    setDrawing(true);
    await dispatch(() => api.drawTeams(room.code, token));
    setDrawing(false);
  }

  function toggleTwist(twist: Twist) {
    const next = activeTwists.includes(twist)
      ? activeTwists.filter((item) => item !== twist)
      : [...activeTwists, twist];

    void dispatch(() =>
      api.changeTwists(room.code, token, next, room.steal_enabled),
    );
  }

  async function copyCode() {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="confetti-dots bg-cream flex min-h-dvh flex-col items-center gap-5 px-5 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))]">
      <button
        type="button"
        onClick={copyCode}
        className="bg-grape stroke-hard hard-shadow-lg flex w-full max-w-sm flex-col items-center rounded-3xl py-4"
        style={{ animation: "rise-in 0.4s both" }}
      >
        <span className="font-display text-lemon pb-2 text-xs uppercase tracking-[0.3em]">
          {copied ? "Copiado!" : "Código da sala"}
        </span>
        <span className="font-display text-paper pb-1 text-6xl leading-tight tracking-[0.2em]">
          {room.code}
        </span>
        <span className="font-display text-lemon pt-1 text-[10px] uppercase tracking-[0.2em] opacity-80">
          versão {copy.modes[room.play_mode].title}
        </span>
      </button>

      {alreadyDrawn ? (
        <section className="w-full max-w-sm">
          <h2 className="font-display text-grape mb-2 text-lg uppercase">
            Os times
          </h2>
          <div className="grid grid-cols-2 items-stretch gap-2">
            {(["red", "blue"] as const).map((team) => {
              const squad = players.filter((player) => player.team === team);

              return (
                <div
                  key={team}
                  className={`stroke-hard hard-shadow flex flex-col gap-2 rounded-2xl p-2 ${teamColors[team]}`}
                >
                  <div className="text-center">
                    <p className="font-display text-paper pb-1 text-xs uppercase leading-none">
                      Time {copy.teams[team]}
                    </p>
                    <p className="font-display text-paper outline-text-thin pb-1 text-3xl leading-tight">
                      {squad.length}
                    </p>
                  </div>
                  <ul className="flex flex-1 flex-col gap-1.5">
                    {squad.length === 0 ? (
                      <li className="border-paper/50 font-display text-paper/70 rounded-lg border-2 border-dashed px-2 py-1.5 text-center text-xs uppercase leading-none">
                        vazio
                      </li>
                    ) : (
                      squad.map((player) => (
                        <li
                          key={player.id}
                          className="bg-paper stroke-thin font-display rounded-lg px-2 py-1.5 text-center text-sm uppercase leading-none"
                        >
                          {player.name}
                          {player.is_host ? " ★" : ""}
                        </li>
                      ))
                    )}
                  </ul>
                  {me.team === team ? null : (
                    <button
                      type="button"
                      onClick={() =>
                        void dispatch(() =>
                          api.changeTeam(room.code, token, team),
                        )
                      }
                      className="font-display bg-paper text-grape stroke-thin mt-auto rounded-lg px-2 py-1 text-xs uppercase"
                    >
                      Passar pra cá
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="w-full max-w-sm">
          <h2 className="font-display text-grape mb-2 text-lg uppercase">
            No microfone ({players.length})
          </h2>
          <div className="bg-paper stroke-hard hard-shadow rounded-2xl p-3">
            <ul className="flex flex-wrap justify-center gap-1.5">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="bg-lemon stroke-thin font-display rounded-lg px-2 py-1 text-sm uppercase"
                  style={{ animation: "rise-in 0.35s both" }}
                >
                  {player.name}
                  {player.is_host ? " ★" : ""}
                </li>
              ))}
            </ul>
            <p className="font-display text-grape mt-3 text-center text-xs uppercase opacity-70">
              Ninguém tem time ainda. O sorteio decide.
            </p>
          </div>
        </section>
      )}

      <section className="w-full max-w-sm">
        <h2 className="font-display text-grape mb-2 text-lg uppercase">
          Repertório
        </h2>
        <div className="flex flex-col gap-2">
          {deckOrder.map((mode) => {
            const active = room.deck_mode === mode;

            return (
              <button
                key={mode}
                type="button"
                disabled={!me.is_host}
                onClick={() =>
                  void dispatch(() => api.changeDeck(room.code, token, mode))
                }
                className={`stroke-hard hard-shadow rounded-2xl px-3 py-2 text-left disabled:opacity-60 ${
                  active ? "bg-coral text-paper" : "bg-paper text-grape"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg uppercase">
                    {copy.decks[mode].name}
                  </span>
                  <span className="font-display text-xs uppercase opacity-80">
                    {deckSizes[mode]} músicas
                  </span>
                </div>
                <p className="text-xs font-bold opacity-90">
                  {copy.decks[mode].description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="w-full max-w-sm">
        <h2 className="font-display text-grape mb-2 text-lg uppercase">
          Modos extras
        </h2>
        <p className="font-display text-grape mb-2 text-xs uppercase leading-snug opacity-70">
          Os ligados entram no sorteio. Cada rodada pode cair um deles, ou
          nenhum.
        </p>
        <div className="flex flex-col gap-2">
          {twistOrder.map((twist) => {
            const active = activeTwists.includes(twist);

            return (
              <button
                key={twist}
                type="button"
                disabled={!me.is_host}
                onClick={() => toggleTwist(twist)}
                className={`stroke-hard hard-shadow flex items-center gap-3 rounded-2xl px-3 py-2 text-left disabled:opacity-60 ${
                  active ? "bg-gold text-grape" : "bg-paper text-grape"
                }`}
              >
                <span
                  className={`stroke-thin flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                    active ? "bg-grape text-lemon" : "bg-cream text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="flex-1">
                  <span className="font-display block text-base uppercase leading-none">
                    {copy.twists[twist].name}
                  </span>
                  <span className="mt-1 block text-xs font-bold opacity-85">
                    {copy.twists[twist].description}
                  </span>
                </span>
              </button>
            );
          })}

          <button
            type="button"
            disabled={!me.is_host}
            onClick={() =>
              void dispatch(() =>
                api.changeTwists(
                  room.code,
                  token,
                  activeTwists,
                  !room.steal_enabled,
                ),
              )
            }
            className={`stroke-hard hard-shadow flex items-center gap-3 rounded-2xl px-3 py-2 text-left disabled:opacity-60 ${
              room.steal_enabled ? "bg-mint text-paper" : "bg-paper text-grape"
            }`}
          >
            <span
              className={`stroke-thin flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                room.steal_enabled
                  ? "bg-grape text-lemon"
                  : "bg-cream text-transparent"
              }`}
              aria-hidden="true"
            >
              ✓
            </span>
            <span className="flex-1">
              <span className="font-display block text-base uppercase leading-none">
                {copy.steal.name}
              </span>
              <span className="mt-1 block text-xs font-bold opacity-85">
                {copy.steal.description}
              </span>
            </span>
          </button>
        </div>

        {me.is_host ? null : (
          <p className="font-display text-grape mt-2 text-center text-xs uppercase opacity-70">
            Só quem criou a sala mexe nessas opções
          </p>
        )}
      </section>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {me.is_host ? (
          <>
            <Button
              color="grape"
              disabled={drawing || players.length < minPlayers}
              onClick={runDraw}
            >
              {drawing
                ? "Sorteando..."
                : alreadyDrawn
                  ? "Sortear de novo"
                  : "Sortear times"}
            </Button>
            <Button
              color="coral"
              disabled={!ready}
              onClick={() =>
                void dispatch(() => api.startGame(room.code, token))
              }
            >
              Começar o jogo
            </Button>
          </>
        ) : (
          <p className="font-display bg-paper stroke-hard hard-shadow rounded-2xl px-4 py-3 text-center text-lg uppercase">
            {alreadyDrawn
              ? "Esperando quem criou a sala começar"
              : "Esperando o sorteio dos times"}
          </p>
        )}

        <Button color="lemon" onClick={onHelp}>
          {copy.home.rules}
        </Button>

        {players.length < minPlayers ? (
          <p className="font-display text-grape text-center text-xs uppercase opacity-80">
            Precisa de {minPlayers} pessoas na sala pra sortear
          </p>
        ) : null}

        {error ? (
          <p
            className="bg-coral text-paper stroke-thin font-display rounded-xl px-4 py-2 text-center text-base uppercase"
            style={{ animation: "shake 0.4s both" }}
          >
            {error}
          </p>
        ) : null}
      </div>

      {showDraw ? (
        <TeamDraw players={players} onClose={() => setShowDraw(false)} />
      ) : null}
    </main>
  );
}
