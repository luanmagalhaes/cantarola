export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(
      /\b(feat|ft|part|pt|remaster(ed)?|ao vivo|live|version|versao|radio edit|single)\b/g,
      " ",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function editDistance(a: string, b: string): number {
  if (a === b) {
    return 0;
  }

  if (a.length === 0 || b.length === 0) {
    return Math.max(a.length, b.length);
  }

  const rows: number[][] = [];

  for (let i = 0; i <= a.length; i += 1) {
    rows.push(new Array<number>(b.length + 1).fill(0));
    rows[i][0] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    rows[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + cost,
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }

  return rows[a.length][b.length];
}

export function closeEnough(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }

  const longest = Math.max(a.length, b.length);

  if (longest < 5) {
    return false;
  }

  const tolerance = longest <= 8 ? 1 : longest <= 14 ? 2 : 3;

  return editDistance(a, b) <= tolerance;
}

export function answerMatches(guess: string, truth: string): boolean {
  const left = normalize(guess);
  const right = normalize(truth);

  if (!left || left.length < 3) {
    return false;
  }

  if (left === right || closeEnough(left, right)) {
    return true;
  }

  const rightWords = right.split(" ").filter((word) => word.length > 2);
  const leftWords = left.split(" ").filter((word) => word.length > 2);

  if (rightWords.length === 0 || leftWords.length === 0) {
    return right.includes(left) || left.includes(right);
  }

  const near = (given: string, target: string) =>
    given === target ||
    target.startsWith(given) ||
    given.startsWith(target) ||
    closeEnough(given, target);

  const hits = rightWords.filter((word) =>
    leftWords.some((given) => near(given, word)),
  ).length;

  return hits / rightWords.length >= 0.6;
}
