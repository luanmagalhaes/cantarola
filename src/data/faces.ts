export const faces = [
  "🦊",
  "🐼",
  "🐝",
  "🐙",
  "🦉",
  "🐸",
  "🦖",
  "🐢",
  "🦩",
  "🐧",
  "🦁",
  "🐨",
  "🦄",
  "🐯",
  "🦈",
  "🐳",
  "🍀",
  "⭐️",
  "🔥",
  "🌈",
  "🍕",
  "🎸",
  "👑",
  "💎",
];

export function randomFace(taken: string[] = []): string {
  const free = faces.filter((face) => !taken.includes(face));
  const pool = free.length > 0 ? free : faces;

  return pool[Math.floor(Math.random() * pool.length)];
}
