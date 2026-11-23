const emptySlot = "";

export function nextHandOrder(
  previous: readonly string[],
  open: readonly string[],
): string[] {
  const openSet = new Set(open);
  const fresh = open.filter((songId) => !previous.includes(songId));
  const slots: string[] = [];
  let taken = 0;

  for (const songId of previous) {
    if (songId !== emptySlot && openSet.has(songId)) {
      slots.push(songId);
      continue;
    }

    if (taken < fresh.length) {
      slots.push(fresh[taken]);
      taken += 1;
      continue;
    }

    slots.push(emptySlot);
  }

  const ordered = [...slots, ...fresh.slice(taken)];

  while (ordered.length > 0 && ordered[ordered.length - 1] === emptySlot) {
    ordered.pop();
  }

  return ordered;
}
