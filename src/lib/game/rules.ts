import type {
  Outcome,
  PlayerRow,
  ResultRow,
  Score,
  Team,
  Twist,
} from "@/types/game";

export const teams: Team[] = ["red", "blue"];
export const minPlayers = 2;
export const maxPlayers = 16;
export const codeLength = 2;
export const songsPerTurn = 8;

export interface NextTurn {
  singerId: string;
  team: Team;
}

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
  if (outcome === "missed") return 0;
  return isBomb ? 2 : 1;
}

export function scoringTeamFor(
  outcome: Outcome,
  singerTeam: Team,
  singerAlone = false,
): Team | null {
  if (outcome === "hit") return singerAlone ? rivalOf(singerTeam) : singerTeam;
  if (outcome === "stolen") return rivalOf(singerTeam);
  return null;
}

export function singerIsAlone(
  players: PlayerRow[],
  singerId: string,
  team: Team,
): boolean {
  const squad = squadOf(players, team);

  return squad.length === 1 && squad[0].id === singerId;
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
  return teamsBalanced(players);
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

function pendingSingers(players: PlayerRow[], team: Team): PlayerRow[] {
  return squadOf(players, team).filter((player) => player.spoke_count === 0);
}

function everyonePlayed(players: PlayerRow[]): boolean {
  return teams.every((team) => pendingSingers(players, team).length === 0);
}

function firstPendingOf(players: PlayerRow[], team: Team): PlayerRow | null {
  const queue = [...pendingSingers(players, team)].sort(
    (one, other) => one.seat - other.seat,
  );
  return queue.length > 0 ? queue[0] : null;
}

function teamOwedTurn(players: PlayerRow[]): Team | null {
  const red = turnsTaken(players, "red");
  const blue = turnsTaken(players, "blue");
  if (red === blue) return null;
  const owed: Team = red < blue ? "red" : "blue";
  return squadOf(players, owed).length > 0 ? owed : null;
}

function leastUsedSinger(players: PlayerRow[], team: Team): PlayerRow | null {
  const squad = squadOf(players, team);
  if (squad.length === 0) return null;
  const fewest = Math.min(...squad.map((player) => player.spoke_count));
  const candidates = squad
    .filter((player) => player.spoke_count === fewest)
    .sort((one, other) => one.seat - other.seat);
  return candidates[0];
}

function preferredTeam(players: PlayerRow[], previousTeam: Team | null): Team {
  if (previousTeam !== null) return rivalOf(previousTeam);
  return teamOwedTurn(players) ?? "red";
}

export function nextTurn(
  players: PlayerRow[],
  previousTeam: Team | null,
): NextTurn | null {
  if (!everyonePlayed(players)) {
    const preferred = preferredTeam(players, previousTeam);
    for (const team of [preferred, rivalOf(preferred)]) {
      const singer = firstPendingOf(players, team);
      if (singer !== null) return { singerId: singer.id, team };
    }
    return null;
  }
  const owed = teamOwedTurn(players);
  if (owed === null) return null;
  const singer = leastUsedSinger(players, owed);
  return singer === null ? null : { singerId: singer.id, team: owed };
}

export function isGameOver(players: PlayerRow[]): boolean {
  return everyonePlayed(players) && teamOwedTurn(players) === null;
}

export function pickTwist(enabled: Twist[]): Twist | null {
  if (enabled.length === 0) return null;
  return shuffle([null, ...enabled])[0];
}

