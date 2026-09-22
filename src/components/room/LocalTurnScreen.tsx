"use client";

import { useEffect, useRef, useState } from "react";
import { SongCard } from "@/components/game/SongCard";
import { PreviewGate } from "@/components/game/PreviewGate";
import { TurnControls } from "@/components/room/TurnControls";
import { TurnHeader } from "@/components/game/TurnHeader";
import { Button } from "@/components/ui/Button";
import { api, type RoomState } from "@/lib/api/client";
import { copy } from "@/data/copy";
import { leftMsFor, useNow } from "@/hooks/useNow";
import { rivalOf } from "@/lib/game/rules";
import { playAnthem, playSound, stopAnthem } from "@/lib/sound";
import type { Outcome, Song, Team } from "@/types/game";

function nameOf(state: RoomState, id: string | null | undefined) {
  return state.players.find((player) => player.id === id)?.name ?? "alguém";
}

export function LocalTurnScreen({
  state,
  token,
  onRefresh,
}: {
  state: RoomState;
  token: string;
  onRefresh: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Song | null>(null);
  const lastResultId = useRef<string | null>(null);
  const closing = useRef(false);

  const { room, turn, isSinger, songs, score } = state;
  const running = turn?.status === "running";
  const stealing = turn?.status === "stealing";
  const now = useNow(Boolean(running));

  const team = (turn?.team ?? "red") as Team;
  const paused = running && Boolean(turn?.paused_at);
  const leftMs = leftMsFor(
    turn?.ends_at,
    turn?.paused_at,
    state.clockOffset,
    now,
  );
  const rawLeft = running
    ? Math.max(0, Math.ceil(leftMs / 1000))
    : room.turn_seconds;
  const secondsLeft = Math.min(rawLeft, room.turn_seconds);
  const warmingUp = running && rawLeft > room.turn_seconds;
  const timeUp = running && !paused && rawLeft <= 0;
  const pending = songs.filter((row) => row.outcome === null);

  useEffect(() => {
    const last = state.results.at(-1);

    if (!last || last.id === lastResultId.current) {
      return;
    }

    const firstRead = lastResultId.current === null;
    lastResultId.current = last.id;

    if (firstRead || isSinger) {
      return;
    }

    playSound(
      last.outcome === "hit"
        ? "right"
        : last.outcome === "stolen"
          ? "steal"
          : "miss",
    );
  }, [state.results, isSinger]);

  useEffect(() => {
    if (!turn?.twist) {
      return;
    }

    playSound("twist");
  }, [turn?.twist]);

  useEffect(() => {
    if (!running || warmingUp || paused || secondsLeft > 10 || secondsLeft <= 0) {
      return;
    }

    playSound("tick");
  }, [secondsLeft, running, warmingUp, paused]);

  useEffect(() => {
    if (!timeUp) {
      return;
    }

    void playAnthem();
  }, [timeUp]);

  useEffect(() => {
    if (!timeUp || closing.current) {
      return;
    }

    const delay = isSinger ? 0 : 2500;
    const timer = setTimeout(() => {
      closing.current = true;
      void api
        .closeTurn(room.code, token)
        .then(onRefresh)
        .finally(() => {
          closing.current = false;
        });
    }, delay);

    return () => clearTimeout(timer);
  }, [timeUp, isSinger, room.code, token, onRefresh]);

  async function dispatch(action: () => Promise<unknown>) {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      setError("");
      await action();
      onRefresh();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : copy.errors.generic,
      );
    } finally {
      setBusy(false);
    }
  }

  function mark(songId: string, outcome: Outcome) {
    playSound(outcome === "hit" ? "right" : outcome === "stolen" ? "steal" : "miss");
    void dispatch(() => api.markSong(room.code, token, songId, outcome));
  }

  if (!turn) {
    return null;
  }

  return (
    <main className="confetti-dots bg-cream flex min-h-dvh flex-col items-center gap-4 px-5 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(3.5rem+var(--safe-top))]">
      <TurnHeader
        singerName={nameOf(state, turn.singer_id)}
        team={team}
        twist={turn.twist}
        secondsLeft={secondsLeft}
        totalSeconds={room.turn_seconds}
        warmingUp={Boolean(warmingUp)}
        score={score}
      />

      {paused ? (
        <p className="font-display bg-lemon text-grape stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-4 py-2 text-center text-lg uppercase leading-none">
          Tempo parado
        </p>
      ) : null}

      <TurnControls
        code={room.code}
        token={token}
        canPause={Boolean(running) && (isSinger || state.me.is_host)}
        paused={Boolean(paused)}
        canUndo={state.me.is_host && state.results.length > 0}
        busy={busy}
        onRefresh={onRefresh}
      />

      {turn.status === "ready" ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-3">
          <div className="bg-paper stroke-hard hard-shadow w-full rounded-2xl px-4 py-5 text-center">
            <p className="font-display text-grape text-2xl uppercase leading-tight">
              {isSinger
                ? "Sua vez de cantarolar"
                : `${nameOf(state, turn.singer_id)} vai cantarolar`}
            </p>
            <p className="mt-2 text-sm font-bold leading-snug opacity-80">
              {isSinger
                ? "Só você vê a lista. Cante com lá lá lá, sem falar o nome nem a letra. Se o time cantar junto, já vale o ponto."
                : "Fique de olho no celular de quem canta só depois que acabar."}
            </p>
          </div>

          {isSinger ? (
            <Button
              color="coral"
              disabled={busy}
              onClick={() => {
                stopAnthem();
                void dispatch(() => api.startTurn(room.code, token));
              }}
            >
              Começar os {room.turn_seconds}s
            </Button>
          ) : (
            <p className="font-display bg-grape text-lemon stroke-hard hard-shadow w-full rounded-2xl px-4 py-3 text-center text-lg uppercase">
              Esperando começar
            </p>
          )}
        </div>
      ) : null}

      {stealing ? (
        <div className="bg-coral stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-4 py-3 text-center">
          <p className="font-display text-paper text-2xl uppercase leading-none">
            Hora do roubo
          </p>
          <p className="text-paper mt-1 text-xs font-bold leading-snug">
            Time {copy.teams[rivalOf(team)]} tenta as que sobraram. Quem cantou
            marca o resultado.
          </p>
        </div>
      ) : null}

      {isSinger && (running || stealing) ? (
        <>
          <ul className="flex w-full max-w-sm flex-col gap-2">
            {songs.map((row, index) => (
              <SongCard
                key={row.songId}
                song={row.song}
                outcome={row.outcome}
                index={index}
                isBomb={turn.bomb_song_id === row.songId}
                actions={
                  row.outcome === null ? (
                    <>
                      {stealing ? (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => mark(row.songId, "stolen")}
                            className="font-display bg-team-blue text-paper stroke-thin flex-1 rounded-lg px-2 py-1.5 text-sm uppercase disabled:opacity-50"
                          >
                            Roubou
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => mark(row.songId, "missed")}
                            className="font-display bg-cream text-grape stroke-thin flex-1 rounded-lg px-2 py-1.5 text-sm uppercase disabled:opacity-50"
                          >
                            Ninguém
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => mark(row.songId, "hit")}
                            className="font-display bg-mint text-paper stroke-thin flex-1 rounded-lg px-2 py-1.5 text-sm uppercase disabled:opacity-50"
                          >
                            Acertou
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => mark(row.songId, "missed")}
                            className="font-display bg-cream text-grape stroke-thin flex-1 rounded-lg px-2 py-1.5 text-sm uppercase disabled:opacity-50"
                          >
                            Passar
                          </button>
                          {row.song ? (
                            <button
                              type="button"
                              onClick={() => setPreview(row.song)}
                              aria-label={`${copy.preview.button}: ${row.song.title}`}
                              className="font-display bg-gold text-grape stroke-thin rounded-lg px-2.5 py-1.5 text-sm uppercase disabled:opacity-50"
                            >
                              ♪
                            </button>
                          ) : null}
                        </>
                      )}
                    </>
                  ) : null
                }
              />
            ))}
          </ul>

          <div className="flex w-full max-w-sm flex-col gap-2">
            {stealing ? (
              <Button
                size="sm"
                className="max-w-sm"
                color="grape"
                disabled={busy}
                onClick={() => void dispatch(() => api.endSteal(room.code, token))}
              >
                Encerrar o roubo
              </Button>
            ) : (
              <Button
                size="sm"
                className="max-w-sm"
                color="grape"
                disabled={busy || pending.length === songs.length}
                onClick={() => void dispatch(() => api.closeTurn(room.code, token))}
              >
                Acabei antes do tempo
              </Button>
            )}
          </div>
        </>
      ) : null}

      {!isSinger && (running || stealing) ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-3">
          <div
            className="bg-paper stroke-hard hard-shadow w-full rounded-2xl px-4 py-6 text-center"
            style={{ animation: "float-soft 2.4s ease-in-out infinite" }}
          >
            <p className="text-5xl" aria-hidden="true">
              🎤
            </p>
            <p className="font-display text-grape mt-2 text-2xl uppercase leading-tight">
              Grita o nome da música
            </p>
            <p className="mt-2 text-sm font-bold leading-snug opacity-80">
              A lista fica escondida de você. Quem canta marca quem acertou.
            </p>
          </div>

          <div className="bg-grape w-full rounded-2xl px-4 py-3 text-center">
            <p className="font-display text-lemon text-4xl leading-none">
              {songs.filter((row) => row.outcome === "hit").length}
              <span className="text-lg"> / {songs.length}</span>
            </p>
            <p className="font-display text-lemon mt-1 text-xs uppercase tracking-wider opacity-80">
              acertadas até agora
            </p>
          </div>
        </div>
      ) : null}

      {turn.status === "done" ? (
        <ul className="flex w-full max-w-sm flex-col gap-2">
          {songs.map((row, index) => (
            <SongCard
              key={row.songId}
              song={row.song}
              outcome={row.outcome}
              index={index}
              isBomb={turn.bomb_song_id === row.songId}
            />
          ))}
        </ul>
      ) : null}

      {error ? (
        <p
          className="bg-coral text-paper stroke-thin font-display w-full max-w-sm rounded-xl px-4 py-2 text-center uppercase"
          style={{ animation: "shake 0.4s both" }}
        >
          {error}
        </p>
      ) : null}

      {preview ? (
        <PreviewGate song={preview} onClose={() => setPreview(null)} />
      ) : null}
    </main>
  );
}
