"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NowSinging } from "@/components/game/NowSinging";
import { PreviewGate } from "@/components/game/PreviewGate";
import { TurnHeader } from "@/components/game/TurnHeader";
import { TakeList, type GuessFeedback } from "@/components/room/TakeList";
import { Button } from "@/components/ui/Button";
import { api, type RoomState, type TakeView } from "@/lib/api/client";
import { copy } from "@/data/copy";
import { leftMsFor, useNow } from "@/hooks/useNow";
import { useRecorder } from "@/hooks/useRecorder";
import { nameOf } from "@/lib/game/players";
import { rivalOf } from "@/lib/game/rules";
import { playSound } from "@/lib/sound";
import { TurnControls } from "@/components/room/TurnControls";
import { VoiceNote } from "@/components/ui/VoiceNote";
import type { Song } from "@/types/game";

const takesIntervalMs = 2500;

export function OnlineTurnScreen({
  state,
  token,
  onRefresh,
}: {
  state: RoomState;
  token: string;
  onRefresh: () => Promise<void> | void;
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
  const answerMs = leftMsFor(
    turn?.answer_ends_at,
    turn?.paused_at,
    state.clockOffset,
    now,
  );
  const rawLeft = running
    ? Math.max(0, Math.ceil(leftMs / 1000))
    : room.turn_seconds;
  const answerLeft = running ? Math.max(0, Math.ceil(answerMs / 1000)) : 0;
  const recordingOver = running && rawLeft <= 0;
  const answering = recordingOver && answerLeft > 0;
  const secondsLeft = Math.min(
    answering ? answerLeft : rawLeft,
    answering ? answerLeft : room.turn_seconds,
  );
  const warmingUp = running && rawLeft > room.turn_seconds;
  const timeUp =
    running && !paused && rawLeft <= 0 && (!turn?.answer_ends_at || answerLeft <= 0);
  const stealing = turn?.status === "stealing";
  const isRival = state.me.team !== turn?.team;
  const soloSinger =
    state.players.filter((player) => player.team === "red").length === 1 &&
    state.players.filter((player) => player.team === "blue").length === 1;
  const canGuess =
    !isSinger &&
    (stealing
      ? isRival
      : !isRival || turn?.twist === "duel" || soloSinger);

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
    if (!recordingOver || !isSinger) {
      return;
    }

    playSound("timeup");
  }, [recordingOver, isSinger]);

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

  async function sendTake(songId: string) {
    if (!recorder.take) {
      return;
    }

    const { blob, seconds } = recorder.take;

    await dispatch(async () => {
      await api.sendTake(room.code, token, songId, blob, seconds, {
        measuredMs: recorder.take?.measuredMs ?? null,
        heldMs: recorder.take?.heldMs ?? 0,
      });
      recorder.reset();
      setTarget(null);
      await Promise.all([loadTakes(), onRefresh()]);
      playSound("card");
    });
  }

  function skip(songId: string) {
    playSound("miss");
    recorder.reset();
    setTarget(null);
    void dispatch(async () => {
      await api.markSong(room.code, token, songId, "skipped");
      await onRefresh();
    });
  }

  function react(takeId: string, emoji: string) {
    void dispatch(async () => {
      await api.react(room.code, token, takeId, emoji);
      await loadTakes();
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

  const current = songs.find((row) => row.songId === state.currentSongId);
  const solvedCount = takes.filter((take) => take.solved).length;

  return (
    <main className="confetti-dots bg-cream flex min-h-dvh flex-col items-center gap-4 px-5 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(3.5rem+var(--safe-top))]">
      <TurnHeader
        singerName={nameOf(state.players, turn.singer_id)}
        team={turn.team}
        twist={turn.twist}
        secondsLeft={secondsLeft}
        totalSeconds={answering ? answerLeft || 1 : room.turn_seconds}
        warmingUp={Boolean(warmingUp)}
        score={score}
        players={state.players}
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

      {answering ? (
        <div className="bg-coral stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-4 py-3 text-center">
          <p className="font-display text-paper text-2xl uppercase leading-none">
            Hora de acertar
          </p>
          <p className="text-paper mt-1 text-xs font-bold leading-snug">
            A gravação fechou. Ainda dá pra ouvir e chutar.
          </p>
        </div>
      ) : null}

      {turn.status === "ready" ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-3">
          <div className="bg-paper stroke-hard hard-shadow w-full rounded-2xl px-4 py-5 text-center">
            <p className="font-display text-grape text-2xl uppercase leading-tight">
              {isSinger
                ? "Sua vez de gravar"
                : `${nameOf(state.players, turn.singer_id)} vai gravar`}
            </p>
            <p className="mt-2 text-sm font-bold leading-snug opacity-80">
              {isSinger
                ? "Aparece uma música por vez. Grave o cantarolo e mande. Não conhece? Passa e vem outra."
                : "Os áudios vão aparecer aqui. Ouça e escreva o nome da música."}
            </p>
          </div>

          {isSinger ? (
            <Button
              color="coral"
              disabled={busy}
              onClick={() =>
                void dispatch(async () => {
                  await api.startTurn(room.code, token);
                  await onRefresh();
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

          {state.me.is_host ? (
            <Button
              size="sm"
              color="paper"
              disabled={busy}
              onClick={() =>
                void dispatch(async () => {
                  await api.changeSinger(room.code, token);
                  await onRefresh();
                })
              }
            >
              Trocar quem canta
            </Button>
          ) : null}
        </div>
      ) : null}

      {isSinger && running && !recordingOver ? (
        <>
          {recorder.status === "blocked" ? (
            <p className="font-display bg-coral text-paper stroke-thin w-full max-w-sm rounded-xl px-3 py-2 text-center text-xs uppercase leading-snug">
              {copy.errors.noMicrophone}
            </p>
          ) : null}

          {current?.song ? (
            <NowSinging
              key={current.songId}
              song={current.song}
              number={songs.length}
              onPreview={() => setPreview(current.song)}
            >
              {recorder.status === "recording" ? (
                <div className="flex w-full items-center gap-2">
                  <button
                    type="button"
                    onClick={() => recorder.stop()}
                    className="bg-coral stroke-hard font-display text-paper flex-1 rounded-2xl px-2 py-3 text-lg uppercase"
                    style={{ animation: "pulse-record 1s infinite" }}
                  >
                    Parar
                  </button>
                  <span className="font-display text-grape text-2xl leading-none">
                    {recorder.seconds}s
                  </span>
                </div>
              ) : recorder.status === "ready" && recorder.take ? (
                <>
                  <VoiceNote
                    src={recorder.take.url}
                    seconds={recorder.take.seconds}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      color="mint"
                      size="sm"
                      disabled={busy}
                      onClick={() => void sendTake(current.songId)}
                    >
                      {busy ? "Mandando" : "Mandar"}
                    </Button>
                    <Button
                      color="paper"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        recorder.reset();
                        setTarget(null);
                      }}
                    >
                      Regravar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {recorder.problem ? (
                    <p className="font-display bg-coral text-paper stroke-thin rounded-lg px-2 py-1.5 text-center text-xs uppercase leading-snug">
                      {recorder.problem}
                    </p>
                  ) : null}
                  <Button
                    color="coral"
                    disabled={
                      busy || (target === current.songId && !recorder.problem)
                    }
                    onClick={() => {
                      recorder.reset();
                      setTarget(current.songId);
                      void recorder.start();
                    }}
                  >
                    {target === current.songId && !recorder.problem
                      ? "Abrindo o microfone"
                      : "● Gravar"}
                  </Button>
                  <Button
                    size="sm"
                    color="paper"
                    disabled={busy}
                    onClick={() => skip(current.songId)}
                  >
                    Passar
                  </Button>
                </>
              )}
            </NowSinging>
          ) : (
            <div className="bg-paper stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-4 py-5 text-center">
              <p className="font-display text-grape text-2xl uppercase leading-tight">
                Puxando a próxima
              </p>
            </div>
          )}

          <p className="font-display text-grape text-center text-sm uppercase opacity-80">
            {takes.length}{" "}
            {takes.length === 1 ? "áudio mandado" : "áudios mandados"} ·{" "}
            {solvedCount} {solvedCount === 1 ? "acertado" : "acertados"}
          </p>

          <Button
            size="sm"
            className="max-w-sm"
            color="grape"
            disabled={
              busy || takes.length === 0 || recorder.status === "recording"
            }
            onClick={() =>
              void dispatch(async () => {
                await api.closeTurn(room.code, token);
                await onRefresh();
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
                ? soloSinger && isRival
                  ? "Só você pra adivinhar. Acertou, o ponto é seu"
                  : "Ouça e escreva o nome da música"
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
            canReact
            onReact={react}
          />
        </>
      ) : null}

      {!isSinger && stealing && state.me.is_host ? (
        <Button
          size="sm"
          className="max-w-sm"
          color="grape"
          disabled={busy}
          onClick={() =>
            void dispatch(async () => {
              await api.endSteal(room.code, token);
              await onRefresh();
            })
          }
        >
          Encerrar o roubo
        </Button>
      ) : null}

      {isSinger && (stealing || answering) ? (
        <>
          <TakeList takes={takes} canGuess={false} busy={busy} onGuess={guess} />
          <Button
            size="sm"
            className="max-w-sm"
            color="grape"
            disabled={busy}
            onClick={() =>
              void dispatch(async () => {
                await (stealing
                  ? api.endSteal(room.code, token)
                  : api.closeTurn(room.code, token));
                await onRefresh();
              })
            }
          >
            {stealing ? "Encerrar o roubo" : "Fechar a rodada"}
          </Button>
        </>
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
        <PreviewGate
          song={preview}
          autoPlay
          onClose={() => setPreview(null)}
        />
      ) : null}
    </main>
  );
}
