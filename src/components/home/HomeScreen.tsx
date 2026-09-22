"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { ModePicker } from "@/components/home/ModePicker";
import { HowToPlay } from "@/components/game/HowToPlay";
import { api } from "@/lib/api/client";
import { copy } from "@/data/copy";
import { saveSession } from "@/lib/session";
import { preloadSounds } from "@/lib/sound";
import type { PlayMode } from "@/types/game";

type Step = "mode" | "choice" | "joining";

export function HomeScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mode");
  const [playMode, setPlayMode] = useState<PlayMode>("local");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tutorial, setTutorial] = useState(false);

  async function dispatch(run: () => Promise<void>) {
    if (busy) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await run();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : copy.errors.generic,
      );
    } finally {
      setBusy(false);
    }
  }

  function enter(session: { code: string; token: string; playerId: string }) {
    saveSession(session);
    router.push(`/room/${session.code}`);
  }

  function createRoom() {
    if (name.trim().length < 2) {
      setError(copy.errors.emptyName);
      return;
    }

    void dispatch(async () => {
      const session = await api.createRoom(name.trim(), "mixed", playMode);
      enter(session);
    });
  }

  function joinRoom() {
    if (name.trim().length < 2) {
      setError(copy.errors.emptyName);
      return;
    }

    if (code.length !== 2) {
      setError(copy.errors.shortCode);
      return;
    }

    void dispatch(async () => {
      const session = await api.joinRoom(code, name.trim());
      enter(session);
    });
  }

  return (
    <main className="confetti-dots bg-cream flex min-h-dvh flex-col items-center gap-6 px-6 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(2.5rem+var(--safe-top))]">
      <div style={{ animation: "rise-in 0.5s both" }}>
        <Wordmark size="md" />
      </div>

      {step === "mode" ? (
        <>
          <ModePicker
            onPick={(mode) => {
              preloadSounds();
              setPlayMode(mode);
              setStep("choice");
            }}
          />

          <div className="flex w-full max-w-sm flex-col gap-2">
            <Button color="paper" onClick={() => setTutorial(true)}>
              {copy.home.rules}
            </Button>
            <Button color="grape" onClick={() => router.push("/history")}>
              {copy.home.history}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-4">
          <p className="font-display bg-grape text-lemon stroke-thin hard-shadow self-center -rotate-1 rounded-xl px-4 py-1 text-sm uppercase">
            Versão {copy.modes[playMode].title}
          </p>

          <label className="font-display text-grape text-lg uppercase tracking-wide">
            {copy.home.nameField}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={copy.home.namePlaceholder}
              maxLength={16}
              className="bg-paper stroke-hard hard-shadow font-sans mt-2 w-full rounded-2xl px-4 py-3 text-xl font-bold outline-none placeholder:opacity-40"
            />
          </label>

          {step === "choice" ? (
            <div className="flex flex-col gap-3">
              <Button color="coral" disabled={busy} onClick={createRoom}>
                {busy ? "Criando..." : copy.home.create}
              </Button>
              <Button color="gold" onClick={() => setStep("joining")}>
                {copy.home.join}
              </Button>
              <Button color="paper" onClick={() => setStep("mode")}>
                {copy.home.changeMode}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="font-display text-grape text-lg uppercase tracking-wide">
                {copy.home.codeField}
                <input
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  placeholder={copy.home.codePlaceholder}
                  inputMode="numeric"
                  autoComplete="off"
                  className="bg-paper stroke-hard hard-shadow font-display mt-2 w-full rounded-2xl px-4 py-3 text-center text-5xl leading-tight tracking-[0.3em] outline-none placeholder:opacity-30"
                />
              </label>
              <Button color="gold" disabled={busy} onClick={joinRoom}>
                {busy ? "Entrando..." : copy.home.confirmJoin}
              </Button>
              <Button color="paper" onClick={() => setStep("choice")}>
                {copy.home.back}
              </Button>
            </div>
          )}

          <p className="font-display text-grape text-center text-xs uppercase leading-snug opacity-70">
            Quem entra pelo código não escolhe a versão. Ela vem da sala.
          </p>

          {error ? (
            <p
              className="bg-coral text-paper stroke-thin font-display rounded-xl px-4 py-2 text-center text-lg uppercase"
              style={{ animation: "shake 0.4s both" }}
            >
              {error}
            </p>
          ) : null}
        </div>
      )}

      {tutorial ? <HowToPlay onClose={() => setTutorial(false)} /> : null}
    </main>
  );
}
