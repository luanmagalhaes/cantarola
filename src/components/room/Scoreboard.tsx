import { copy } from "@/data/copy";
import type { PlayerRow, Score, Team } from "@/types/game";

const backgrounds: Record<Team, string> = {
  red: "bg-team-red",
  blue: "bg-team-blue",
};

export function Scoreboard({
  score,
  players,
  highlight,
  pulsing,
  onTeamTap,
}: {
  score: Score;
  players?: PlayerRow[];
  highlight?: Team | null;
  pulsing?: Team | null;
  onTeamTap?: (team: Team) => void;
}) {
  return (
    <div className="flex w-full max-w-sm items-stretch gap-2">
      {(["red", "blue"] as const).map((team) => {
        const names = (players ?? [])
          .filter((player) => player.team === team)
          .map((player) => player.name);

        const face = (
          <>
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
            {names.length > 0 ? (
              <span className="text-paper/90 w-full px-2 pb-1 text-center text-[10px] font-bold uppercase leading-tight">
                {names.join(" · ")}
              </span>
            ) : null}
          </>
        );

        const skin = `stroke-hard hard-shadow flex flex-1 flex-col items-center rounded-2xl py-2 ${
          backgrounds[team]
        } ${highlight === team ? "scale-105" : "opacity-90"}`;

        return onTeamTap ? (
          <button
            key={team}
            type="button"
            onClick={() => onTeamTap(team)}
            aria-label={`Ver as músicas do time ${copy.teams[team]}`}
            className={`${skin} cursor-pointer transition-transform active:scale-95`}
          >
            {face}
          </button>
        ) : (
          <div key={team} className={skin}>
            {face}
          </div>
        );
      })}
    </div>
  );
}
