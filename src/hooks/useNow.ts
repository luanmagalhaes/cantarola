"use client";

import { useEffect, useState } from "react";

export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return;
    }

    const timer = setInterval(() => setNow(Date.now()), 250);

    return () => clearInterval(timer);
  }, [active]);

  return now;
}

export function leftMsFor(
  endsAt: string | null | undefined,
  pausedAt: string | null | undefined,
  clockOffset: number,
  now: number,
) {
  if (!endsAt) {
    return 0;
  }

  if (pausedAt) {
    return Date.parse(endsAt) - Date.parse(pausedAt);
  }

  return Date.parse(endsAt) - (now + clockOffset);
}
