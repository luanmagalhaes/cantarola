"use client";

export type SoundName =
  | "tap"
  | "card"
  | "right"
  | "steal"
  | "miss"
  | "tick"
  | "timeup"
  | "draw"
  | "twist"
  | "win";

const names: SoundName[] = [
  "tap",
  "card",
  "right",
  "steal",
  "miss",
  "tick",
  "timeup",
  "draw",
  "twist",
  "win",
];

const volumes: Record<SoundName, number> = {
  tap: 0.35,
  card: 0.5,
  right: 0.6,
  steal: 0.65,
  miss: 0.5,
  tick: 0.4,
  timeup: 0.65,
  draw: 0.6,
  twist: 0.6,
  win: 0.7,
};

const mutedKey = "cantarola:muted";

const listeners = new Set<() => void>();
const elements = new Map<SoundName, HTMLAudioElement>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeMuted(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function readMuted(): boolean {
  return window.localStorage.getItem(mutedKey) === "1";
}

export function mutedOnServer(): boolean {
  return false;
}

export function toggleMuted() {
  const next = !readMuted();

  window.localStorage.setItem(mutedKey, next ? "1" : "0");

  if (next) {
    stopAnthem();
  }

  notify();
}

function elementFor(name: SoundName): HTMLAudioElement | null {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = elements.get(name);

  if (existing) {
    return existing;
  }

  const audio = new Audio(`/sounds/${name}.wav`);

  audio.preload = "auto";
  audio.volume = volumes[name];
  elements.set(name, audio);

  return audio;
}

export function preloadSounds() {
  names.forEach((name) => elementFor(name)?.load());
}

const anthem = { artist: "Zaynara", title: "Quem Manda em Mim" };

let anthemAudio: HTMLAudioElement | null = null;
let anthemUrl: Promise<string | null> | null = null;

function anthemPreview(): Promise<string | null> {
  if (!anthemUrl) {
    const query = new URLSearchParams(anthem).toString();

    anthemUrl = fetch(`/api/preview?${query}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => (data?.previewUrl as string | undefined) ?? null)
      .catch(() => null);
  }

  return anthemUrl;
}

export function primeAnthem() {
  if (typeof window !== "undefined") {
    void anthemPreview();
  }
}

export async function playAnthem() {
  if (typeof window === "undefined" || readMuted()) {
    return;
  }

  const url = await anthemPreview();

  if (!url) {
    playSound("timeup");

    return;
  }

  anthemAudio?.pause();
  anthemAudio = new Audio(url);
  anthemAudio.volume = 0.55;

  try {
    await anthemAudio.play();
  } catch {
    playSound("timeup");
  }
}

export function silenceAll() {
  stopAnthem();
  elements.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}

export function stopAnthem() {
  anthemAudio?.pause();
  anthemAudio = null;
}

export function playSound(name: SoundName) {
  if (typeof window === "undefined" || readMuted()) {
    return;
  }

  const audio = elementFor(name);

  if (!audio) {
    return;
  }

  try {
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  } catch {
    return;
  }
}
