import type {
  Outcome,
  PlayerRow,
  ResultRow,
  Score,
  Team,
  TurnSongRow,
  Twist,
} from "@/types/game";

export const teams: Team[] = ["red", "blue"];
export const minPlayers = 2;
export const maxPlayers = 16;
export const codeLength = 2;
export const bombReach = 5;

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    const held = copy[index];
    copy[index] = copy[target];
    copy[target] = held;
  }
  return copy;
}

export function rivalOf(team: Team): Team {
  return team === "red" ? "blue" : "red";
}

export function pointsFor(outcome: Outcome, isBomb: boolean): number {
  if (outcome === "missed" || outcome === "skipped") return 0;
  return isBomb ? 2 : 1;
}

export function scoringTeamFor(
  outcome: Outcome,
  singerTeam: Team,
  oneOnOne = false,
): Team | null {
  if (outcome === "hit") return oneOnOne ? rivalOf(singerTeam) : singerTeam;
  if (outcome === "stolen") return rivalOf(singerTeam);
  return null;
}

export function isOneOnOne(players: PlayerRow[]): boolean {
  return teams.every((team) => squadOf(players, team).length === 1);
}

function squadsPlayable(players: PlayerRow[]): boolean {
  const sizes = teams.map((team) => squadOf(players, team).length);

  return sizes.every((size) => size === 1) || sizes.every((size) => size >= 2);
}

export function scoreFrom(results: ResultRow[]): Score {
  const score: Score = { red: 0, blue: 0 };
  for (const result of results) {
    if (result.scoring_team === null) continue;
    score[result.scoring_team] += result.points;
  }
  return score;
}

export function winnerOf(score: Score): Team | "tie" {
  if (score.red > score.blue) return "red";
  if (score.blue > score.red) return "blue";
  return "tie";
}

function squadOf(players: PlayerRow[], team: Team): PlayerRow[] {
  return players.filter((player) => player.team === team);
}

export function withoutTeam(players: PlayerRow[]): PlayerRow[] {
  return players.filter((player) => player.team === null);
}

export function teamsBalanced(players: PlayerRow[]): boolean {
  if (withoutTeam(players).length > 0) return false;
  const gap = Math.abs(
    squadOf(players, "red").length - squadOf(players, "blue").length,
  );
  return gap <= 1;
}

export function canStart(players: PlayerRow[]): boolean {
  if (players.length < minPlayers) return false;
  if (players.length > maxPlayers) return false;
  if (!teamsBalanced(players)) return false;
  return squadsPlayable(players);
}

export function assignTeams(players: PlayerRow[]): Map<string, Team> {
  const assignment = new Map<string, Team>();
  shuffle(players).forEach((player, index) => {
    assignment.set(player.id, teams[index % teams.length]);
  });
  return assignment;
}

export function turnsTaken(players: PlayerRow[], team: Team): number {
  return squadOf(players, team).reduce(
    (total, player) => total + player.spoke_count,
    0,
  );
}

export function canSing(player: PlayerRow | undefined): boolean {
  return Boolean(player && player.team !== null);
}

export function teamBehind(players: PlayerRow[]): Team | null {
  const red = turnsTaken(players, "red");
  const blue = turnsTaken(players, "blue");

  if (red === blue) {
    return null;
  }

  return red < blue ? "red" : "blue";
}

export function currentSongOf(
  rows: TurnSongRow[],
  recorded: Set<string> = new Set(),
): TurnSongRow | null {
  const latest = [...rows].sort(
    (one, other) => other.position - one.position,
  )[0];

  if (!latest || latest.outcome !== null || recorded.has(latest.song_id)) {
    return null;
  }

  return latest;
}

export function pileOrder<T extends { id: string }>(
  pool: readonly T[],
  resting: ReadonlySet<string>,
): T[] {
  const shuffled = shuffle([...pool]);

  return [
    ...shuffled.filter((song) => !resting.has(song.id)),
    ...shuffled.filter((song) => resting.has(song.id)),
  ];
}

export function pickBombPosition(): number {
  return Math.floor(Math.random() * bombReach);
}

export function pickTwist(enabled: Twist[]): Twist | null {
  if (enabled.length === 0) return null;
  return shuffle([null, ...enabled])[0];
}

