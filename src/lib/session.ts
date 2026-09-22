"use client";

export interface Session {
  code: string;
  token: string;
  playerId: string;
}

const key = "la-la-la:session";
const tutorialKey = "la-la-la:tutorial";

const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedSession: Session | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function readSession(): Session | null {
  const raw =
    window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);

  if (raw !== cachedRaw) {
    cachedRaw = raw;

    try {
      cachedSession = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      cachedSession = null;
    }
  }

  return cachedSession;
}

export function sessionOnServer(): Session | null {
  return null;
}

export function saveSession(session: Session, thisTabOnly = false) {
  const target = thisTabOnly ? window.sessionStorage : window.localStorage;

  target.setItem(key, JSON.stringify(session));
  notify();
}

export function clearSession() {
  window.sessionStorage.removeItem(key);
  window.localStorage.removeItem(key);
  notify();
}

export function readTutorialSeen(): boolean {
  return window.localStorage.getItem(tutorialKey) === "1";
}

export function tutorialOnServer(): boolean {
  return true;
}

export function markTutorialSeen() {
  window.localStorage.setItem(tutorialKey, "1");
  notify();
}
