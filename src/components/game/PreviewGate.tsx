"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api/client";
import { copy } from "@/data/copy";
import type { Song } from "@/types/game";

type Phase = "warning" | "loading" | "playing" | "missing";

function Headphones() {
  return (
    <svg viewBox="0 0 64 56" className="mx-auto h-20 w-24" aria-hidden="true">
      <g stroke="var(--color-grape)" strokeWidth="3.5" strokeLinejoin="round">
        <path d="M12 38V30a20 20 0 0 1 40 0v8" fill="none" />
        <rect
          x="6"
          y="34"
          width="12"
          height="18"
          rx="5"
          fill="var(--color-coral)"
        />
        <rect
          x="46"
          y="34"
          width="12"
          height="18"
          rx="5"
          fill="var(--color-coral)"
        />
      </g>
    </svg>
  );
}

export function PreviewGate({
  song,
  onClose,
}: {
  song: Song;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("warning");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  async function play() {
    setPhase("loading");

    try {
      const { previewUrl } = await api.preview(song.artist, song.title);

      if (!previewUrl) {
        setPhase("missing");
        return;
      }

      const audio = new Audio(previewUrl);

      audio.volume = 0.9;
      audioRef.current = audio;
      audio.addEventListener("ended", onClose);
      await audio.play();
      setPhase("playing");
    } catch {
      setPhase("missing");
    }
  }

  return (
    <div className="bg-grape/90 fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="bg-paper stroke-hard w-full max-w-sm rounded-3xl p-5 text-center shadow-[0_12px_0_var(--color-grape)]"
        style={{ animation: "bounce-in 0.45s both" }}
      >
        <Headphones />

        <h2 className="font-display text-coral mt-3 text-3xl uppercase leading-none">
          {copy.preview.warningTitle}
        </h2>

        {phase === "playing" ? (
          <>
            <p className="mt-3 text-sm font-bold leading-snug">
              Tocando um pedaço de{" "}
              <strong className="font-display font-normal">{song.title}</strong>
              .
            </p>
            <div className="mt-4">
              <Button
                color="grape"
                onClick={() => {
                  audioRef.current?.pause();
                  onClose();
                }}
              >
                Parar e voltar
              </Button>
            </div>
          </>
        ) : phase === "missing" ? (
          <>
            <p className="mt-3 text-sm font-bold leading-snug">
              {copy.preview.missing}
            </p>
            <div className="mt-4">
              <Button color="grape" onClick={onClose}>
                Voltar
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-bold leading-snug">
              {copy.preview.warningBody}
            </p>
            <p className="font-display bg-coral text-paper stroke-thin mt-3 inline-block -rotate-1 rounded-xl px-3 py-1 text-base uppercase">
              {copy.preview.warningRule}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                color="mint"
                disabled={phase === "loading"}
                onClick={play}
              >
                {phase === "loading" ? "Procurando..." : copy.preview.confirm}
              </Button>
              <Button color="paper" onClick={onClose}>
                {copy.preview.cancel}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
