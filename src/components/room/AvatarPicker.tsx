"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { faces } from "@/data/faces";
import { api } from "@/lib/api/client";
import { shrinkToBlob } from "@/lib/photo";
import { playSound } from "@/lib/sound";
import type { PlayerRow } from "@/types/game";

export function AvatarPicker({
  code,
  token,
  me,
  onDone,
}: {
  code: string;
  token: string;
  me: PlayerRow;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const file = useRef<HTMLInputElement>(null);

  async function run(action: () => Promise<unknown>) {
    if (busy) {
      return;
    }

    setBusy(true);
    setProblem("");

    try {
      await action();
      onDone();
    } catch (cause) {
      setProblem(cause instanceof Error ? cause.message : "Não rolou.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-paper stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar name={me.name} photo={me.avatar} emoji={me.emoji} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-grape text-lg uppercase leading-tight">
            Sua cara
          </p>
          <p className="text-grape/70 text-xs font-bold leading-snug">
            Escolhe um bichinho ou manda uma foto sua.
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-8 gap-1">
        {faces.map((face) => (
          <button
            key={face}
            type="button"
            disabled={busy}
            aria-label={`Usar ${face}`}
            aria-pressed={me.emoji === face}
            onClick={() => {
              playSound("tap");
              void run(() => api.setEmoji(code, token, face));
            }}
            className={`stroke-thin rounded-lg py-1 text-xl disabled:opacity-50 ${
              me.emoji === face ? "bg-lemon" : "bg-cream"
            }`}
          >
            {face}
          </button>
        ))}
      </div>

      <input
        ref={file}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const picked = event.target.files?.[0];

          event.target.value = "";

          if (!picked) {
            return;
          }

          void run(async () => {
            const small = await shrinkToBlob(picked);

            await api.setPhoto(code, token, small);
          });
        }}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => {
          playSound("tap");
          file.current?.click();
        }}
        className="font-display bg-gold text-grape stroke-thin mt-2 w-full rounded-lg px-2 py-1.5 text-sm uppercase disabled:opacity-50"
      >
        {busy ? "Um instante" : "Usar minha foto"}
      </button>

      {problem ? (
        <p className="font-display bg-coral text-paper stroke-thin mt-2 rounded-lg px-2 py-1 text-center text-xs uppercase leading-snug">
          {problem}
        </p>
      ) : null}
    </div>
  );
}
