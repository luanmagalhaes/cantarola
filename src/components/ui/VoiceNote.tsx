"use client";

import { useEffect, useRef, useState } from "react";

const speeds = [1, 1.5, 2];

function clock(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safe / 60);
  const rest = Math.floor(safe % 60);

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function bars(seed: string, count: number): number[] {
  let hash = 0;

  for (let at = 0; at < seed.length; at += 1) {
    hash = (hash * 31 + seed.charCodeAt(at)) % 100000;
  }

  return Array.from({ length: count }, (_, index) => {
    hash = (hash * 1103515245 + 12345) % 2147483648;

    return 0.25 + ((hash >> 8) % 100) / 133;
  });
}

export function VoiceNote({
  src,
  seconds,
  tone = "dark",
}: {
  src: string;
  seconds: number;
  tone?: "dark" | "light";
}) {
  const player = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [ready, setReady] = useState(false);

  const shape = bars(src, 34);
  const total = seconds > 0 ? seconds : 1;
  const progress = Math.min(1, at / total);

  useEffect(() => {
    const audio = player.current;

    if (!audio) {
      return;
    }

    audio.playbackRate = speed;
  }, [speed]);

  async function toggle() {
    const audio = player.current;

    if (!audio) {
      return;
    }

    if (playing) {
      audio.pause();

      return;
    }

    document.querySelectorAll("audio").forEach((other) => {
      if (other !== audio && !other.paused) {
        other.pause();
      }
    });

    if (audio.ended || audio.currentTime >= total - 0.05) {
      audio.currentTime = 0;
    }

    try {
      await audio.play();
    } catch {
      setPlaying(false);
    }
  }

  const ink = tone === "dark" ? "text-grape" : "text-paper";
  const filled = tone === "dark" ? "bg-grape" : "bg-paper";
  const empty = tone === "dark" ? "bg-grape/25" : "bg-paper/35";

  return (
    <div className="mt-2 flex w-full items-center gap-2">
      <audio
        ref={player}
        src={src}
        preload="auto"
        onLoadedMetadata={(event) => {
          setReady(true);

          if (event.currentTarget.currentTime > 0.05) {
            event.currentTarget.currentTime = 0;
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setAt(0);
        }}
        onTimeUpdate={(event) => setAt(event.currentTarget.currentTime)}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={playing ? "Pausar o áudio" : "Tocar o áudio"}
        className={`stroke-thin flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          tone === "dark" ? "bg-grape text-lemon" : "bg-paper text-grape"
        }`}
      >
        {playing ? (
          <span className="flex gap-[3px]">
            <span className="bg-current block h-4 w-[3px] rounded-sm" />
            <span className="bg-current block h-4 w-[3px] rounded-sm" />
          </span>
        ) : (
          <span className="ml-[2px] block border-y-[7px] border-l-[11px] border-y-transparent border-l-current" />
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          const audio = player.current;

          if (!audio || !ready) {
            return;
          }

          audio.currentTime = 0;
          setAt(0);
        }}
        aria-label="Voltar o áudio para o início"
        className="flex min-w-0 flex-1 items-end gap-[2px] py-1"
      >
        {shape.map((height, index) => (
          <span
            key={index}
            className={`w-full rounded-full ${
              index / shape.length <= progress ? filled : empty
            }`}
            style={{ height: `${Math.round(height * 22)}px` }}
          />
        ))}
      </button>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className={`font-display text-[0.65rem] leading-none ${ink}`}>
          {clock(playing || at > 0 ? total - at : total)}
        </span>
        <button
          type="button"
          onClick={() =>
            setSpeed(speeds[(speeds.indexOf(speed) + 1) % speeds.length])
          }
          aria-label="Mudar a velocidade"
          className={`font-display stroke-thin rounded-md px-1 text-[0.6rem] leading-tight ${
            tone === "dark" ? "bg-lemon text-grape" : "bg-paper/25 text-paper"
          }`}
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}
