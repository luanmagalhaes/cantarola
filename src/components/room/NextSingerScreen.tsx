"use client";

import { useState } from "react";
import { SongCard } from "@/components/game/SongCard";
import { Scoreboard } from "@/components/room/Scoreboard";
import { TurnControls } from "@/components/room/TurnControls";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api, type RoomState } from "@/lib/api/client";
import { copy } from "@/data/copy";
import { nameOf } from "@/lib/game/players";
import { teamBehind, teams } from "@/lib/game/rules";
import type { Team } from "@/types/game";

const teamColors: Record<Team, string> = {
  red: "bg-team-red",
  blue: "bg-team-blue",
};

export function NextSingerScreen({
  state,
  token,
  onRefresh,
}: {
  state: RoomState;
  token: string;
  onRefresh: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  const { room, players, me, turn, songs, score } = state;
  const lastTurn = turn?.status === "done" ? turn : null;
  const host = players.find((player) => player.is_host);
  const behind = teamBehind(players);
  const nobodySang = players.every((player) => player.spoke_count === 0);
  const lastHits = songs.filter((row) => row.outcome === "hit").length;

  async function dispatch(action: () => Promise<unknown>) {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      setError("");
      await action();
      await onRefresh();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : copy.errors.generic,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="confetti-dots bg-cream flex min-h-dvh flex-col items-center gap-4 px-5 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(3.5rem+var(--safe-top))]">
      <Scoreboard score={score} players={players} />

      {me.is_host ? (
        <section className="w-full max-w-sm">
          <h2 className="font-display text-grape text-center text-2xl uppercase leading-tight">
            {nobodySang ? "Quem começa?" : "Quem canta agora?"}
          </h2>
          <p className="font-display text-grape mb-3 mt-1 text-center text-xs uppercase leading-snug opacity-70">
            {behind
              ? `O time ${copy.teams[behind]} cantou menos vezes`
              : "Toque em quem vai cantar"}
          </p>

          <div className="grid grid-cols-2 items-stretch gap-2">
            {teams.map((team) => (
              <div
                key={team}
                className={`stroke-hard hard-shadow flex flex-col gap-1.5 rounded-2xl p-2 ${teamColors[team]}`}
              >
                <p className="font-display text-paper pb-1 text-center text-xs uppercase leading-none">
                  Time {copy.teams[team]}
                </p>
                {players
                  .filter((player) => player.team === team)
                  .map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void dispatch(() =>
                          api.chooseSinger(room.code, token, player.id),
                        )
                      }
                      className="bg-paper text-grape stroke-thin font-display flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm uppercase leading-none transition-transform active:scale-95 disabled:opacity-50"
                    >
                      <Avatar
                        name={player.name}
                        photo={player.avatar}
                        emoji={player.emoji}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {player.name}
                      </span>
                      <span className="bg-cream stroke-thin shrink-0 rounded-md px-1.5 py-0.5 text-[10px]">
                        {player.spoke_count}x
                      </span>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="font-display bg-grape text-lemon stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-4 py-3 text-center text-lg uppercase leading-tight">
          Esperando {host?.name ?? "quem criou a sala"} escolher quem canta
        </p>
      )}

      {me.is_host ? (
        <div className="flex w-full max-w-sm flex-col gap-2">
          <Button
            size="sm"
            color="coral"
            disabled={busy}
            onClick={() => setConfirmingEnd(true)}
          >
            Encerrar a partida
          </Button>
          <TurnControls
            code={room.code}
            token={token}
            canPause={false}
            paused={false}
            canUndo={state.results.length > 0}
            busy={busy}
            onRefresh={onRefresh}
          />
        </div>
      ) : null}

      {error ? (
        <p
          className="bg-coral text-paper stroke-thin font-display w-full max-w-sm rounded-xl px-4 py-2 text-center uppercase"
          style={{ animation: "shake 0.4s both" }}
        >
          {error}
        </p>
      ) : null}

      {lastTurn ? (
        <section className="w-full max-w-sm">
          <h2 className="font-display text-grape text-lg uppercase leading-tight">
            Como foi a vez de {nameOf(state.players, lastTurn.singer_id)}
          </h2>
          <p className="font-display text-grape mb-2 text-xs uppercase opacity-70">
            {lastHits} {lastHits === 1 ? "acerto" : "acertos"}
          </p>
          <ul className="flex flex-col gap-2">
            {songs.map((row, index) => (
              <SongCard
                key={row.songId}
                song={row.song}
                outcome={row.outcome}
                index={index}
                isBomb={lastTurn.bomb_song_id === row.songId}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {confirmingEnd ? (
        <div className="bg-grape/85 fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="bg-paper stroke-hard w-full max-w-sm rounded-3xl p-5 text-center shadow-[0_12px_0_var(--color-grape)]"
            style={{ animation: "bounce-in 0.4s both" }}
          >
            <p className="font-display text-grape text-2xl uppercase leading-tight">
              Encerrar a partida?
            </p>
            <p className="mt-2 text-sm font-bold leading-snug opacity-75">
              O placar fecha em {copy.teams.red} {score.red} x {score.blue}{" "}
              {copy.teams.blue} e ninguém canta mais.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                color="coral"
                disabled={busy}
                onClick={() => {
                  setConfirmingEnd(false);
                  void dispatch(() => api.endMatch(room.code, token));
                }}
              >
                Encerrar
              </Button>
              <Button color="paper" onClick={() => setConfirmingEnd(false)}>
                Continuar jogando
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
