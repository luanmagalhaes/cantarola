"use client";

import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import type { PlayerRow } from "@/types/game";

export function WaitingGate({
  me,
  onLeave,
}: {
  me: PlayerRow;
  onLeave: () => void;
}) {
  return (
    <main className="confetti-dots bg-cream flex min-h-dvh flex-col px-6 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(2.5rem+var(--safe-top))]">
      <div className="m-auto flex w-full max-w-sm flex-col items-center gap-5 text-center">
        <Wordmark size="md" withTagline={false} />

        <div className="bg-paper stroke-hard hard-shadow w-full rounded-2xl p-5">
          <p className="font-display text-grape text-xl uppercase leading-tight">
            Peraí, {me.name}
          </p>
          <p className="text-grape mt-2 text-sm font-bold leading-snug">
            A partida já começou. Quem abriu a sala precisa te colocar num time
            ou devolver o seu lugar, se você já estava jogando.
          </p>
          <p className="text-grape/70 mt-2 text-xs font-bold uppercase leading-snug">
            Deixe essa tela aberta, ela muda sozinha.
          </p>
        </div>

        <Button color="paper" onClick={onLeave}>
          Desistir e sair
        </Button>
      </div>
    </main>
  );
}
