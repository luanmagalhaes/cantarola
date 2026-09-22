import type { MatchRow, RankingRow } from "@/types/game";

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function currentMonth(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

export function matchesInMonth(
  matches: readonly MatchRow[],
  month: string,
): MatchRow[] {
  return matches.filter((match) => monthOf(match.finished_at) === month);
}

export function availableMonths(matches: readonly MatchRow[]): string[] {
  return [...new Set(matches.map((match) => monthOf(match.finished_at)))].sort(
    (one, other) => other.localeCompare(one),
  );
}

export function ranking(matches: readonly MatchRow[]): RankingRow[] {
  const byPerson = new Map<string, RankingRow>();

  matches.forEach((match) => {
    match.players.forEach((player) => {
      const key = player.name.trim().toLowerCase();
      const current = byPerson.get(key) ?? {
        name: player.name.trim(),
        wins: 0,
        matches: 0,
        points: 0,
      };

      const teamPoints =
        player.team === "red" ? match.score_red : match.score_blue;

      byPerson.set(key, {
        name: current.name,
        matches: current.matches + 1,
        wins: current.wins + (match.winner === player.team ? 1 : 0),
        points: current.points + teamPoints,
      });
    });
  });

  return [...byPerson.values()].sort(
    (one, other) =>
      other.wins - one.wins ||
      other.points - one.points ||
      one.name.localeCompare(other.name),
  );
}

export function monthLabel(month: string): string {
  const names = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  const [year, number] = month.split("-");

  return `${names[Number(number) - 1]} de ${year}`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}
