"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { clearSession } from "@/lib/session";
import { playSound } from "@/lib/sound";

export function LeaveButton() {
  const router = useRouter();
  const [asking, setAsking] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Sair da sala"
        onClick={() => {
          playSound("tap");
          setAsking(true);
        }}
        className="bg-paper stroke-hard hard-shadow fixed left-3 top-[calc(0.75rem+var(--safe-top))] z-50 flex h-11 w-11 items-center justify-center rounded-full"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <g
            fill="none"
            stroke="var(--color-grape)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 5l-7 7 7 7" />
            <path d="M8 12h11" />
          </g>
        </svg>
      </button>

      {asking ? (
        <div className="bg-grape/85 fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="bg-paper stroke-hard w-full max-w-sm rounded-3xl p-5 text-center shadow-[0_12px_0_var(--color-grape)]"
            style={{ animation: "bounce-in 0.4s both" }}
          >
            <p className="font-display text-grape text-2xl uppercase leading-tight">
              Sair da sala?
            </p>
            <p className="mt-2 text-sm font-bold leading-snug opacity-75">
              Você volta pro começo. Dá pra entrar de novo pelo código, mas a
              partida segue sem você.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                color="coral"
                onClick={() => {
                  clearSession();
                  router.push("/");
                }}
              >
                Sair
              </Button>
              <Button color="paper" onClick={() => setAsking(false)}>
                Ficar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
