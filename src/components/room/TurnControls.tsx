"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api/client";
import { playSound } from "@/lib/sound";

interface Props {
  code: string;
  token: string;
  canPause: boolean;
  paused: boolean;
  canUndo: boolean;
  busy: boolean;
  onRefresh: () => void;
}

export function TurnControls({
  code,
  token,
  canPause,
  paused,
  canUndo,
  busy,
  onRefresh,
}: Props) {
  const [working, setWorking] = useState(false);
  const [undone, setUndone] = useState("");
  const [error, setError] = useState("");

  async function run(action: () => Promise<unknown>) {
    if (working || busy) {
      return;
    }

    setWorking(true);
    setError("");

    try {
      await action();
      onRefresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não rolou.");
    } finally {
      setWorking(false);
    }
  }

  if (!canPause && !canUndo) {
    return null;
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div className="flex gap-2">
        {canPause ? (
          <Button
            size="sm"
            color={paused ? "lemon" : "paper"}
            disabled={working || busy}
            onClick={() => {
              playSound("tap");
              void run(() =>
                paused
                  ? api.resumeTurn(code, token)
                  : api.pauseTurn(code, token),
              );
            }}
          >
            {paused ? "Voltar o tempo" : "Pausar"}
          </Button>
        ) : null}

        {canUndo ? (
          <Button
            size="sm"
            color="paper"
            disabled={working || busy}
            onClick={() => {
              playSound("tap");
              void run(async () => {
                const result = await api.undoResult(code, token);

                setUndone(
                  result.song
                    ? `Tirei o ponto de "${result.song}"`
                    : "Tirei a última jogada",
                );
              });
            }}
          >
            Tirar ponto
          </Button>
        ) : null}
      </div>

      {undone ? (
        <p className="font-display bg-lemon text-grape stroke-thin rounded-xl px-3 py-1.5 text-center text-xs uppercase leading-snug">
          {undone}
        </p>
      ) : null}

      {error ? (
        <p className="font-display bg-coral text-paper stroke-thin rounded-xl px-3 py-1.5 text-center text-xs uppercase leading-snug">
          {error}
        </p>
      ) : null}
    </div>
  );
}
