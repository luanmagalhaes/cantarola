"use client";

import { useEffect, useRef, useState } from "react";
import { HandCard } from "@/components/game/HandCard";
import { NowSinging } from "@/components/game/NowSinging";
import { TeamSongsModal } from "@/components/room/TeamSongsModal";
import { TurnControls } from "@/components/room/TurnControls";
import { TurnHeader } from "@/components/game/TurnHeader";
import { Button } from "@/components/ui/Button";
import { api, type RoomState } from "@/lib/api/client";
import { copy } from "@/data/copy";
import { leftMsFor, useNow } from "@/hooks/useNow";
import { nameOf } from "@/lib/game/players";
import { isOneOnOne, rivalOf } from "@/lib/game/rules";
import { playSound } from "@/lib/sound";
import type { Outcome, Team } from "@/types/game";

const teamButtons: Record<Team, string> = {
  red: "bg-team-red text-paper",
  blue: "bg-team-blue text-paper",
};

function soundFor(outcome: Outcome) {
  if (outcome === "hit") {
    return "right";
  }

  return outcome === "stolen" ? "steal" : "miss";
}

export function LocalTurnScreen({
  state,
  token,
  onRefresh,
}: {
  state: RoomState;
  token: string;
  onRefresh: () => Promise<void> | void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [localOutcomes, setLocalOutcomes] = useState<Record<string, Outcome>>(
    {},
  );
  const [songsOf, setSongsOf] = useState<Team | null>(null);
  const lastResultId = useRef<string | null>(null);
  const closing = useRef(false);

  const { room, turn, isSinger, songs, score } = state;
  const turnId = turn?.id ?? null;
  const [seenTurnId, setSeenTurnId] = useState(turnId);

  if (turnId !== seenTurnId) {
    setSeenTurnId(turnId);
    setLocalOutcomes({});
  }
  const running = turn?.status === "running";
  const stealing = turn?.status === "stealing";
  const now = useNow(Boolean(running));

  const team = (turn?.team ?? "red") as Team;
  const rival = rivalOf(team);
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
  const openSongs = songs.filter(
    (row) => row.outcome === null && !localOutcomes[row.songId],
  );
  const stealTarget = openSongs[0];
  const countOutcome = (kind: Outcome) =>
    songs.filter(
      (row) => row.outcome === kind ||
        (row.outcome === null && localOutcomes[row.songId] === kind),
    ).length;
  const hits = countOutcome("hit");
  const skipped = countOutcome("skipped");
  const settled = songs.length - openSongs.length;
  const duel = turn?.twist === "duel" && !isOneOnOne(state.players);

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

    playSound(soundFor(last.outcome));
  }, [state.results, isSinger]);

  useEffect(() => {
    if (!turn?.twist) {
      return;
    }

    playSound("twist");
  }, [turn?.twist]);

  useEffect(() => {
    if (
      !running ||
      warmingUp ||
      paused ||
      secondsLeft > 10 ||
      secondsLeft <= 0
    ) {
      return;
    }

    playSound("tick");
  }, [secondsLeft, running, warmingUp, paused]);

  useEffect(() => {
    if (!timeUp) {
      return;
    }

    playSound("timeup");
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
      await onRefresh();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : copy.errors.generic,
      );
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  function mark(songId: string, outcome: Outcome) {
    if (localOutcomes[songId]) {
      return;
    }

    playSound(soundFor(outcome));
    setLocalOutcomes((before) => ({ ...before, [songId]: outcome }));

    void api
      .markSong(room.code, token, songId, outcome)
      .then(() => onRefresh())
      .catch((failure) => {
        setLocalOutcomes((before) => {
          const next = { ...before };

          delete next[songId];

          return next;
        });
        setError(
          failure instanceof Error ? failure.message : copy.errors.generic,
        );
        void onRefresh();
      });
  }

  if (!turn) {
    return null;
  }

  return (
    <main className="confetti-dots bg-cream flex min-h-dvh flex-col items-center gap-4 px-5 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(3.5rem+var(--safe-top))]">
      <TurnHeader
        singerName={nameOf(state.players, turn.singer_id)}
        team={team}
        twist={turn.twist}
        secondsLeft={secondsLeft}
        totalSeconds={room.turn_seconds}
        warmingUp={Boolean(warmingUp)}
        score={score}
        players={state.players}
        onTeamTap={setSongsOf}
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
                : `${nameOf(state.players, turn.singer_id)} vai cantarolar`}
            </p>
            <p className="mt-2 text-sm font-bold leading-snug opacity-80">
              {isSinger
                ? "Você vê 5 músicas de uma vez, só na sua tela, com a letra embaixo. Cantarole a que souber. Não conhece? Passa e entra outra no lugar."
                : "Quando o tempo começar, grite o nome da música."}
            </p>
          </div>

          {isSinger ? (
            <Button
              color="coral"
              disabled={busy}
              onClick={() =>
                void dispatch(() => api.startTurn(room.code, token))
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
                void dispatch(() => api.changeSinger(room.code, token))
              }
            >
              Trocar quem canta
            </Button>
          ) : null}
        </div>
      ) : null}

      {stealing ? (
        <div className="bg-coral stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-4 py-3 text-center">
          <p className="font-display text-paper text-2xl uppercase leading-none">
            Hora do roubo
          </p>
          <p className="text-paper mt-1 text-xs font-bold leading-snug">
            Time {copy.teams[rival]} tenta acertar a última música. Quem cantou
            marca o resultado.
          </p>
        </div>
      ) : null}

      {isSinger && running ? (
        openSongs.length > 0 ? (
          <ul className="flex w-full max-w-sm flex-col gap-3">
            {openSongs.map((row) =>
              row.song ? (
                <HandCard
                  key={row.songId}
                  song={row.song}
                  lyrics={state.lyricsById?.[row.songId]}
                >
                  {duel ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      {([team, rival] as const).map((side) => (
                        <button
                          key={side}
                          type="button"
                          onClick={() =>
                            mark(row.songId, side === team ? "hit" : "stolen")
                          }
                          className={`font-display stroke-hard rounded-xl px-2 py-2 text-sm uppercase leading-tight ${teamButtons[side]}`}
                        >
                          {copy.teams[side]} acertou
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Button
                      color="mint"
                      size="sm"
                      onClick={() => mark(row.songId, "hit")}
                    >
                      Acertou
                    </Button>
                  )}
                  <Button
                    size="sm"
                    color="paper"
                    onClick={() => mark(row.songId, "skipped")}
                  >
                    Passar
                  </Button>
                </HandCard>
              ) : null,
            )}
          </ul>
        ) : (
          <div className="bg-paper stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-4 py-5 text-center">
            <p className="font-display text-grape text-2xl uppercase leading-tight">
              {timeUp ? "Acabou o tempo" : "Puxando as próximas"}
            </p>
          </div>
        )
      ) : null}

      {isSinger && running ? (
        <div className="flex w-full max-w-sm flex-col gap-2">
          <p className="font-display text-grape text-center text-sm uppercase opacity-80">
            {hits} {hits === 1 ? "acerto" : "acertos"} · {skipped}{" "}
            {skipped === 1 ? "passada" : "passadas"}
          </p>
          <Button
            size="sm"
            color="grape"
            disabled={busy || settled === 0}
            onClick={() => void dispatch(() => api.closeTurn(room.code, token))}
          >
            Encerrar minha vez
          </Button>
        </div>
      ) : null}

      {isSinger && stealing ? (
        stealTarget?.song ? (
          <NowSinging
            key={stealTarget.songId}
            song={stealTarget.song}
            number={songs.length}
          >
            <button
              type="button"
              disabled={busy}
              onClick={() => mark(stealTarget.songId, "stolen")}
              className={`font-display stroke-hard rounded-2xl px-2 py-3 text-xl uppercase leading-tight disabled:opacity-50 ${teamButtons[rival]}`}
            >
              {copy.teams[rival]} roubou
            </button>
            <Button
              size="sm"
              color="paper"
              disabled={busy}
              onClick={() => mark(stealTarget.songId, "missed")}
            >
              Ninguém acertou
            </Button>
          </NowSinging>
        ) : (
          <Button
            size="sm"
            color="grape"
            disabled={busy}
            onClick={() => void dispatch(() => api.endSteal(room.code, token))}
          >
            Encerrar o roubo
          </Button>
        )
      ) : null}

      {!isSinger && stealing && state.me.is_host ? (
        <Button
          size="sm"
          color="grape"
          className="max-w-sm"
          disabled={busy}
          onClick={() => void dispatch(() => api.endSteal(room.code, token))}
        >
          Encerrar o roubo
        </Button>
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
              {stealing && state.me.team === rival
                ? "Rouba essa!"
                : "Grita o nome da música"}
            </p>
            <p className="mt-2 text-sm font-bold leading-snug opacity-80">
              A música fica escondida de você. Quem canta marca quem acertou.
            </p>
          </div>

          <div className="bg-grape w-full rounded-2xl px-4 py-3 text-center">
            <p className="font-display text-lemon text-4xl leading-none">
              {hits}
            </p>
            <p className="font-display text-lemon mt-1 text-xs uppercase tracking-wider opacity-80">
              {hits === 1 ? "acertada até agora" : "acertadas até agora"}
            </p>
          </div>
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

      {songsOf ? (
        <TeamSongsModal
          team={songsOf}
          code={room.code}
          token={token}
          onClose={() => setSongsOf(null)}
        />
      ) : null}
    </main>
  );
}
