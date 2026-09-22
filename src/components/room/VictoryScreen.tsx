"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Scoreboard } from "@/components/room/Scoreboard";
import { api, type RoomState } from "@/lib/api/client";
import { copy } from "@/data/copy";
import { winnerOf } from "@/lib/game/rules";
import { playSound, stopAnthem } from "@/lib/sound";

const confettiColors = [
  "var(--color-coral)",
  "var(--color-lemon)",
  "var(--color-gold)",
  "var(--color-mint)",
  "var(--color-team-blue)",
];

const confetti = Array.from({ length: 34 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  delay: `${(index % 12) * 0.22}s`,
  duration: `${2.4 + ((index * 7) % 18) / 10}s`,
  color: confettiColors[index % confettiColors.length],
  width: index % 3 === 0 ? 14 : 9,
  height: index % 4 === 0 ? 9 : 16,
}));

function Microphone() {
  return (
    <svg viewBox="0 0 64 80" className="h-32 w-28" aria-hidden="true">
      <g stroke="var(--color-grape)" strokeWidth="3.5" strokeLinejoin="round">
        <rect
          x="22"
          y="6"
          width="20"
          height="34"
          rx="10"
          fill="var(--color-gold)"
        />
        <path d="M14 34a18 18 0 0 0 36 0" fill="none" strokeLinecap="round" />
        <path d="M32 52v12" fill="none" strokeLinecap="round" />
        <rect
          x="20"
          y="64"
          width="24"
          height="10"
          rx="4"
          fill="var(--color-coral)"
        />
      </g>
      <g
        stroke="var(--color-grape)"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.85"
      >
        <path d="M12 16l-6-4" />
        <path d="M52 16l6-4" />
        <path d="M14 26H6" />
        <path d="M50 26h8" />
      </g>
    </svg>
  );
}

export function VictoryScreen({
  state,
  token,
}: {
  state: RoomState;
  token: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const champion = winnerOf(state.score);

  useEffect(() => {
    stopAnthem();
    playSound("win");
  }, []);

  return (
    <main className="confetti-dots bg-cream relative flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden px-5 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(2rem+var(--safe-top))]">
      {confetti.map((piece, index) => (
        <span
          key={index}
          className="absolute top-0 rounded-sm"
          style={{
            left: piece.left,
            width: piece.width,
            height: piece.height,
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.duration} ${piece.delay} linear infinite`,
          }}
        />
      ))}

      <div
        className="relative z-10 flex flex-col items-center"
        style={{ animation: "trophy-in 0.7s both" }}
      >
        <Microphone />
        <h1 className="font-display text-lemon outline-text mt-2 text-center text-5xl uppercase leading-none">
          {champion === "tie" ? "Deu empate" : `Time ${copy.teams[champion]}`}
        </h1>
        {champion === "tie" ? null : (
          <p className="font-display bg-grape text-lemon stroke-thin hard-shadow mt-3 -rotate-2 rounded-xl px-4 py-1 text-lg uppercase">
            Afinou melhor
          </p>
        )}
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-3">
        <Scoreboard
          score={state.score}
          highlight={champion === "tie" ? null : champion}
        />

        {state.me.is_host ? (
          <Button
            color="coral"
            onClick={async () => {
              try {
                await api.restart(state.room.code, token);
              } catch (failure) {
                setError(
                  failure instanceof Error
                    ? failure.message
                    : copy.errors.generic,
                );
              }
            }}
          >
            Jogar de novo
          </Button>
        ) : (
          <p className="font-display bg-paper stroke-hard hard-shadow w-full rounded-2xl px-4 py-3 text-center text-lg uppercase">
            Esperando quem criou a sala
          </p>
        )}

        <Button color="grape" onClick={() => router.push("/history")}>
          Ver o histórico
        </Button>

        {error ? (
          <p className="bg-coral text-paper stroke-thin font-display w-full rounded-xl px-4 py-2 text-center uppercase">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
