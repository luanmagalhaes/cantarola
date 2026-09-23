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
  const [previewBroken, setPreviewBroken] = useState(false);
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
    if (!recordingOver) {
      return;
    }

    void playAnthem();
  }, [recordingOver]);

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
        totalSeconds={answering ? answerLeft || 1 : room.turn_seconds}
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

      {isSinger && running && !recordingOver ? (
        <>
          <div className="bg-grape w-full max-w-sm rounded-2xl px-4 py-3 text-center">
            <p className="font-display text-lemon text-lg uppercase leading-tight">
              Aperte o vermelho e cantarole
            </p>
            <p className="text-paper mt-1 text-xs font-bold leading-snug">
              {recorder.status === "blocked"
                ? copy.errors.noMicrophone
                : "O ♪ toca um trecho pra você lembrar. Mande quantas der."}
            </p>
          </div>

          <ul className="flex w-full max-w-sm flex-col gap-2">
            {songs.map((row, index) => {
              const alreadySent = sentSongIds.has(row.songId);
              const mine = target === row.songId;
              const preparing = mine && recorder.status === "idle";
              const recording = mine && recorder.status === "recording";
              const ready = mine && recorder.status === "ready" && recorder.take;
              const otherBusy = !mine && recorder.status === "recording";

              return (
                <SongCard
                  key={row.songId}
                  song={row.song}
                  outcome={row.outcome}
                  index={index}
                  isBomb={turn.bomb_song_id === row.songId}
                  actions={
                    row.outcome === null ? (
                      recording ? (
                        <div className="flex w-full items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              playSound("tap");
                              recorder.stop();
                            }}
                            className="bg-coral stroke-hard font-display text-paper flex-1 rounded-lg px-2 py-2 text-sm uppercase"
                            style={{ animation: "pulse-record 1s infinite" }}
                          >
                            Parar
                          </button>
                          <span className="font-display text-grape text-xl leading-none">
                            {recorder.seconds}s
                          </span>
                        </div>
                      ) : ready && recorder.take ? (
                        <div className="flex w-full flex-col gap-2">
                          {previewBroken ? (
                            <p className="font-display bg-lemon text-grape stroke-thin rounded-lg px-2 py-1.5 text-center text-xs uppercase leading-snug">
                              Seu aparelho não toca a prévia, mas a gravação de{" "}
                              {recorder.take.seconds}s está aqui. Pode mandar.
                            </p>
                          ) : (
                            <audio
                              src={recorder.take.url}
                              controls
                              className="w-full"
                              onError={() => setPreviewBroken(true)}
                            />
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                playSound("tap");
                                void sendTake();
                              }}
                              className="font-display bg-mint text-paper stroke-thin flex-1 rounded-lg px-2 py-2 text-sm uppercase disabled:opacity-50"
                            >
                              {busy ? "Mandando" : "Mandar"}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                playSound("tap");
                                recorder.reset();
                                setTarget(null);
                              }}
                              className="font-display bg-paper text-grape stroke-thin rounded-lg px-3 py-2 text-sm uppercase disabled:opacity-50"
                            >
                              Regravar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex w-full flex-col gap-2">
                          {mine && recorder.problem ? (
                            <p className="font-display bg-coral text-paper stroke-thin rounded-lg px-2 py-1.5 text-center text-xs uppercase leading-snug">
                              {recorder.problem}
                            </p>
                          ) : null}
                          <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={alreadySent || otherBusy || preparing}
                            onClick={() => {
                              playSound("card");
                              recorder.reset();
                              setPreviewBroken(false);
                              setTarget(row.songId);
                              void recorder.start();
                            }}
                            aria-label={`Gravar ${row.song?.title ?? "essa música"}`}
                            className="bg-coral stroke-thin font-display text-paper flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-sm uppercase disabled:opacity-40"
                          >
                            <span className="text-base leading-none">●</span>
                            {alreadySent
                              ? "Já mandei"
                              : preparing
                                ? "Abrindo o microfone"
                                : "Gravar"}
                          </button>
                          {row.song ? (
                            <button
                              type="button"
                              onClick={() => {
                                playSound("tap");
                                setPreview(row.song);
                              }}
                              aria-label={`${copy.preview.button}: ${row.song.title}`}
                              className="font-display bg-gold text-grape stroke-thin rounded-lg px-2.5 py-1.5 text-sm uppercase"
                            >
                              ♪
                            </button>
                          ) : null}
                          </div>
                        </div>
                      )
                    ) : null
                  }
                />
              );
            })}
          </ul>

          <Button
            size="sm"
            className="max-w-sm"
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
                onRefresh();
              })
            }
          >
            {stealing ? "Encerrar o roubo" : "Fechar a rodada"}
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
        <PreviewGate
          song={preview}
          autoPlay
          onClose={() => setPreview(null)}
        />
      ) : null}
    </main>
  );
}
