"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PreviewGate } from "@/components/game/PreviewGate";
import { SongCard } from "@/components/game/SongCard";
import { TurnHeader } from "@/components/game/TurnHeader";
import { TakeList, type GuessFeedback } from "@/components/room/TakeList";
import { Button } from "@/components/ui/Button";
import { api, type RoomState, type TakeView } from "@/lib/api/client";
import { copy } from "@/data/copy";
import { leftMsFor, useNow } from "@/hooks/useNow";
import { useRecorder } from "@/hooks/useRecorder";
import { rivalOf } from "@/lib/game/rules";
import { playAnthem, playSound, stopAnthem } from "@/lib/sound";
import { TurnControls } from "@/components/room/TurnControls";
import type { Song } from "@/types/game";

const takesIntervalMs = 2500;

function nameOf(state: RoomState, id: string | null | undefined) {
  return state.players.find((player) => player.id === id)?.name ?? "alguém";
}

export function OnlineTurnScreen({
  state,
  token,
  onRefresh,
}: {
  state: RoomState;
  token: string;
  onRefresh: () => void;
}) {
  const [takes, setTakes] = useState<TakeView[]>([]);
  const [target, setTarget] = useState<string | null>(null);
  const [preview, setPreview] = useState<Song | null>(null);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [feedback, setFeedback] = useState<GuessFeedback | null>(null);
  const [busy, setBusy] = useState(false);
  const lastResultId = useRef<string | null>(null);
  const closing = useRef(false);

  const { room, turn, isSinger, songs, score } = state;
  const running = turn?.status === "running";
  const now = useNow(Boolean(running));
  const recorder = useRecorder(Math.min(30, room.turn_seconds));

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
  const stealing = turn?.status === "stealing";
  const isRival = state.me.team !== turn?.team;
  const canGuess =
    !isSinger &&
    (stealing ? isRival : !isRival || turn?.twist === "duel");

  const loadTakes = useCallback(async () => {
    try {
      const { takes: rows } = await api.takes(room.code, token);

      setTakes(rows);
    } catch {
      return;
    }
  }, [room.code, token]);

  useEffect(() => {
    const first = setTimeout(() => void loadTakes(), 0);
    const timer = setInterval(() => void loadTakes(), takesIntervalMs);

    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [loadTakes]);

  useEffect(() => {
    const last = state.results.at(-1);

    if (!last || last.id === lastResultId.current) {
      return;
    }

    const firstRead = lastResultId.current === null;
    lastResultId.current = last.id;

    if (firstRead) {
      return;
    }

    playSound(last.outcome === "hit" ? "right" : "miss");
    void loadTakes();
  }, [state.results, loadTakes]);

  useEffect(() => {
    if (!turn?.twist) {
      return;
    }

    playSound("twist");
  }, [turn?.twist]);

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
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : copy.errors.generic,
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendTake() {
    if (!recorder.take || !target) {
      return;
    }

    const songId = target;
    const { blob, seconds } = recorder.take;

    await dispatch(async () => {
      await api.sendTake(room.code, token, songId, blob, seconds);
      recorder.reset();
      setTarget(null);
      await loadTakes();
      playSound("card");
    });
  }

  function guess(takeId: string, body: string) {
    void dispatch(async () => {
      const answer = await api.guess(room.code, token, takeId, body);

      if (answer.correct && answer.song) {
        playSound("right");
        setFeedback({
          takeId,
          correct: true,
          message: `Isso! Era ${answer.song.title}`,
        });
        setFlash(`Isso! Era ${answer.song.title}`);
        setTimeout(() => setFlash(""), 3200);
      } else {
        playSound("miss");
        setFeedback({
          takeId,
          correct: false,
          message: `"${body}" não é. Ouve de novo e tenta outra.`,
        });
        setFlash("");
      }

      await loadTakes();
      onRefresh();
    });
  }

  if (!turn) {
    return null;
  }

  const sentSongIds = new Set(
    takes.map((take) => take.songId).filter((id): id is string => id !== null),
  );

  return (
    <main className="confetti-dots bg-cream flex min-h-dvh flex-col items-center gap-4 px-5 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(3.5rem+var(--safe-top))]">
      <TurnHeader
        singerName={nameOf(state, turn.singer_id)}
        team={turn.team}
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
                ? "Sua vez de gravar"
                : `${nameOf(state, turn.singer_id)} vai gravar`}
            </p>
            <p className="mt-2 text-sm font-bold leading-snug opacity-80">
              {isSinger
                ? "Escolha uma música da lista, grave o cantarolo e mande. Quantas der no tempo."
                : "Os áudios vão aparecer aqui. Ouça e escreva o nome da música."}
            </p>
          </div>

          {isSinger ? (
            <Button
              color="coral"
              disabled={busy}
              onClick={() =>
                void dispatch(async () => {
                  stopAnthem();
                  await api.startTurn(room.code, token);
                  onRefresh();
                })
              }
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

      {isSinger && running ? (
        <>
          <div className="bg-grape w-full max-w-sm rounded-2xl px-4 py-3 text-center">
            <p className="font-display text-lemon text-lg uppercase leading-tight">
              {target
                ? "Grave o cantarolo dessa música"
                : "Escolha qual música vai cantarolar"}
            </p>
            {recorder.status === "blocked" ? (
              <p className="text-paper mt-1 text-xs font-bold leading-snug">
                {copy.errors.noMicrophone}
              </p>
            ) : null}
          </div>

          {target ? (
            <div className="bg-paper stroke-hard hard-shadow flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl px-4 py-4">
              {recorder.status === "recording" ? (
                <>
                  <button
                    type="button"
                    onClick={recorder.stop}
                    className="bg-coral stroke-hard font-display text-paper flex h-24 w-24 items-center justify-center rounded-full text-lg uppercase"
                    style={{ animation: "pulse-record 1s infinite" }}
                  >
                    Parar
                  </button>
                  <p className="font-display text-grape text-2xl leading-none">
                    {recorder.seconds}s
                  </p>
                </>
              ) : recorder.status === "ready" && recorder.take ? (
                <>
                  <audio
                    src={recorder.take.url}
                    controls
                    className="w-full"
                  />
                  <div className="flex w-full gap-2">
                    <Button color="mint" disabled={busy} onClick={sendTake}>
                      {busy ? "Mandando..." : "Mandar"}
                    </Button>
                    <Button color="paper" onClick={recorder.reset}>
                      Regravar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void recorder.start()}
                    className="bg-coral stroke-hard font-display text-paper flex h-24 w-24 items-center justify-center rounded-full text-4xl"
                    aria-label="Começar a gravar"
                  >
                    ●
                  </button>
                  <p className="font-display text-grape text-sm uppercase opacity-75">
                    toque para gravar
                  </p>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  recorder.reset();
                  setTarget(null);
                }}
                className="font-display text-grape text-xs uppercase underline"
              >
                Trocar de música
              </button>
            </div>
          ) : (
            <ul className="flex w-full max-w-sm flex-col gap-2">
              {songs.map((row, index) => {
                const alreadySent = sentSongIds.has(row.songId);

                return (
                  <SongCard
                    key={row.songId}
                    song={row.song}
                    outcome={row.outcome}
                    index={index}
                    isBomb={turn.bomb_song_id === row.songId}
                    actions={
                      row.outcome === null ? (
                        <>
                          <button
                            type="button"
                            disabled={alreadySent}
                            onClick={() => setTarget(row.songId)}
                            className="font-display bg-mint text-paper stroke-thin flex-1 rounded-lg px-2 py-1.5 text-sm uppercase disabled:opacity-40"
                          >
                            {alreadySent ? "Já mandei" : "Cantarolar essa"}
                          </button>
                          {row.song ? (
                            <button
                              type="button"
                              onClick={() => setPreview(row.song)}
                              aria-label={`${copy.preview.button}: ${row.song.title}`}
                              className="font-display bg-gold text-grape stroke-thin rounded-lg px-2.5 py-1.5 text-sm uppercase"
                            >
                              ♪
                            </button>
                          ) : null}
                        </>
                      ) : null
                    }
                  />
                );
              })}
            </ul>
          )}

          <Button
            color="grape"
            disabled={busy || sentSongIds.size === 0}
            onClick={() =>
              void dispatch(async () => {
                await api.closeTurn(room.code, token);
                onRefresh();
              })
            }
          >
            Acabei antes do tempo
          </Button>
        </>
      ) : null}

      {stealing ? (
        <div className="bg-coral stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-4 py-3 text-center">
          <p className="font-display text-paper text-2xl uppercase leading-none">
            Hora do roubo
          </p>
          <p className="text-paper mt-1 text-xs font-bold leading-snug">
            Time {copy.teams[rivalOf(turn.team)]} tenta os áudios que ninguém
            acertou. As músicas sem áudio já saíram.
          </p>
        </div>
      ) : null}

      {turn.twist === "duel" && running ? (
        <p className="font-display bg-team-blue text-paper stroke-thin w-full max-w-sm rounded-xl px-3 py-1.5 text-center text-xs uppercase leading-snug">
          Duelo: os dois times chutam. Quem mandar o certo primeiro leva.
        </p>
      ) : null}

      {!isSinger && (running || stealing) ? (
        <>
          <div className="bg-grape w-full max-w-sm rounded-2xl px-4 py-2 text-center">
            <p className="font-display text-lemon text-sm uppercase leading-tight">
              {canGuess
                ? "Ouça e escreva o nome da música"
                : stealing
                  ? "O roubo é do outro time"
                  : "Só o time de quem canta chuta essa rodada"}
            </p>
          </div>

          <TakeList
            takes={takes}
            canGuess={canGuess}
            busy={busy}
            onGuess={guess}
            feedback={feedback}
          />
        </>
      ) : null}

      {isSinger && stealing ? (
        <>
          <TakeList takes={takes} canGuess={false} busy={busy} onGuess={guess} />
          <Button
            color="grape"
            disabled={busy}
            onClick={() =>
              void dispatch(async () => {
                await api.endSteal(room.code, token);
                onRefresh();
              })
            }
          >
            Encerrar o roubo
          </Button>
        </>
      ) : null}

      {isSinger && takes.length > 0 && running ? (
        <div className="bg-paper stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-4 py-3 text-center">
          <p className="font-display text-grape text-lg uppercase leading-tight">
            {takes.filter((take) => take.solved).length} de {takes.length}{" "}
            áudios acertados
          </p>
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

      {flash ? (
        <p
          className="bg-mint text-paper stroke-hard hard-shadow font-display fixed bottom-6 left-1/2 z-40 w-[min(22rem,90vw)] -translate-x-1/2 rounded-xl px-4 py-3 text-center text-lg uppercase leading-tight"
          style={{ animation: "rise-in 0.3s both" }}
        >
          {flash}
        </p>
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
