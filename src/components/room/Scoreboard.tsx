import { copy } from "@/data/copy";
import type { Score, Team } from "@/types/game";

const backgrounds: Record<Team, string> = {
  red: "bg-team-red",
  blue: "bg-team-blue",
};

export function Scoreboard({
  score,
  highlight,
  pulsing,
}: {
  score: Score;
  highlight?: Team | null;
  pulsing?: Team | null;
}) {
  return (
    <div className="flex w-full max-w-sm items-stretch gap-2">
      {(["red", "blue"] as const).map((team) => (
        <div
          key={team}
          className={`stroke-hard hard-shadow flex flex-1 flex-col items-center rounded-2xl py-2 ${
            backgrounds[team]
          } ${highlight === team ? "scale-105" : "opacity-90"}`}
        >
          <span className="font-display text-paper pb-1 text-xs uppercase tracking-wider">
            {copy.teams[team]}
          </span>
          <span
            className="font-display text-paper outline-text-thin pb-1 text-4xl leading-tight"
            style={
              pulsing === team
                ? { animation: "score-pop 0.5s ease-out" }
                : undefined
            }
          >
            {score[team]}
          </span>
        </div>
      ))}
    </div>
  );
}
