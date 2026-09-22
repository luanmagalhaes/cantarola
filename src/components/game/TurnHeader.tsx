import { Scoreboard } from "@/components/room/Scoreboard";
import { copy } from "@/data/copy";
import type { Score, Team, Twist } from "@/types/game";

const teamColors: Record<Team, string> = {
  red: "text-team-red",
  blue: "text-team-blue",
};

export function TurnHeader({
  singerName,
  team,
  twist,
  secondsLeft,
  totalSeconds,
  warmingUp,
  score,
}: {
  singerName: string;
  team: Team;
  twist: Twist | null;
  secondsLeft: number;
  totalSeconds: number;
  warmingUp: boolean;
  score: Score;
}) {
  const share = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const urgent = !warmingUp && secondsLeft <= 10;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <Scoreboard score={score} highlight={team} />

      <div className="bg-paper stroke-hard hard-shadow w-full rounded-2xl px-4 py-3 text-center">
        <p className="font-display text-grape text-xs uppercase tracking-wider opacity-70">
          No microfone
        </p>
        <p
          className={`font-display pb-1 text-2xl uppercase leading-tight ${teamColors[team]}`}
        >
          {singerName}
        </p>

        <div className="bg-cream stroke-thin relative mt-1 h-7 overflow-hidden rounded-full">
          <div
            className={`absolute inset-y-0 left-0 transition-[width] duration-300 ease-linear ${
              urgent ? "bg-coral" : "bg-mint"
            }`}
            style={{ width: `${share * 100}%` }}
          />
          <span
            className="font-display text-grape absolute inset-0 flex items-center justify-center text-base leading-none"
            style={urgent ? { animation: "shake 0.4s infinite" } : undefined}
          >
            {warmingUp ? "preparando..." : `${secondsLeft}s`}
          </span>
        </div>
      </div>

      {twist ? (
        <div
          className="bg-gold stroke-hard hard-shadow w-full -rotate-1 rounded-2xl px-4 py-2 text-center"
          style={{ animation: "stamp-in 0.5s both" }}
        >
          <p className="font-display text-grape text-xl uppercase leading-none">
            {copy.twists[twist].name}
          </p>
          <p className="text-grape mt-1 text-xs font-bold leading-snug">
            {copy.twists[twist].description}
          </p>
        </div>
      ) : null}
    </div>
  );
}
