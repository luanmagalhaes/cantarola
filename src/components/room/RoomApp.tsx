"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HowToPlay } from "@/components/game/HowToPlay";
import { ChatBubble } from "@/components/room/ChatBubble";
import { LeaveButton } from "@/components/room/LeaveButton";
import { LobbyScreen } from "@/components/room/LobbyScreen";
import { CrewPanel } from "@/components/room/CrewPanel";
import { MyFace } from "@/components/room/MyFace";
import { WaitingGate } from "@/components/room/WaitingGate";
import { WaitingRequests } from "@/components/room/WaitingRequests";
import { LocalTurnScreen } from "@/components/room/LocalTurnScreen";
import { NextSingerScreen } from "@/components/room/NextSingerScreen";
import { OnlineTurnScreen } from "@/components/room/OnlineTurnScreen";
import { VictoryScreen } from "@/components/room/VictoryScreen";
import { Button } from "@/components/ui/Button";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { Wordmark } from "@/components/ui/Wordmark";
import { useRoom } from "@/hooks/useRoom";
import {
  clearSession,
  readSession,
  saveSession,
  sessionOnServer,
  subscribe,
} from "@/lib/session";

export function RoomApp({ code }: { code: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const invite = params.get("t");
  const [tutorial, setTutorial] = useState(false);
  const [crew, setCrew] = useState(false);
  const session = useSyncExternalStore(subscribe, readSession, sessionOnServer);
  const token = session?.code === code ? session.token : invite;

  useEffect(() => {
    if (!invite) {
      return;
    }

    const apply = setTimeout(() => {
      saveSession({ code, token: invite, playerId: "" }, true);
      router.replace(`/room/${code}`);
    }, 0);

    return () => clearTimeout(apply);
  }, [invite, code, router]);

  const { state, error, loading, refresh } = useRoom(code, token);

  if (!token) {
    return (
      <main className="confetti-dots bg-cream flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
        <Wordmark size="md" withTagline={false} />
        <p className="font-display text-grape text-center text-xl uppercase">
          Você ainda não entrou nessa sala
        </p>
        <Button color="coral" onClick={() => router.push("/")}>
          Ir para o começo
        </Button>
      </main>
    );
  }

  if (loading && !state) {
    return (
      <main className="confetti-dots bg-cream flex min-h-dvh items-center justify-center">
        <div style={{ animation: "float-soft 1.6s ease-in-out infinite" }}>
          <Wordmark size="md" withTagline={false} />
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="confetti-dots bg-cream flex min-h-dvh flex-col items-center justify-center gap-5 px-6">
        <p className="font-display bg-coral text-paper stroke-hard hard-shadow rounded-2xl px-4 py-3 text-center text-lg uppercase">
          {error ?? "Não achei essa sala"}
        </p>
        <Button
          color="paper"
          onClick={() => {
            clearSession();
            router.push("/");
          }}
        >
          Voltar ao começo
        </Button>
      </main>
    );
  }

  if (state.me.seat < 0) {
    return (
      <WaitingGate
        me={state.me}
        onLeave={() => {
          clearSession();
          router.push("/");
        }}
      />
    );
  }

  const online = state.room.play_mode === "online";
  const picking = !state.turn || state.turn.status === "done";

  return (
    <>
      <SoundToggle />
      <LeaveButton />
      <MyFace code={code} token={token} me={state.me} onDone={refresh} />

      {state.me.is_host ? (
        <button
          type="button"
          aria-label="Quem está na sala"
          onClick={() => setCrew(true)}
          className="bg-paper stroke-hard hard-shadow fixed left-[4.25rem] top-[calc(0.75rem+var(--safe-top))] z-50 flex h-11 w-11 items-center justify-center rounded-full"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <g
              fill="none"
              stroke="var(--color-grape)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3.5 19c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8" />
              <path d="M16 5.6a3.2 3.2 0 0 1 0 5.8" />
              <path d="M17.4 14.6c2 .6 3.1 2.2 3.1 4.4" />
            </g>
          </svg>
        </button>
      ) : null}

      {state.me.is_host && state.waiting.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-[80] flex justify-center px-3 pb-[calc(0.75rem+var(--safe-bottom))]">
          <WaitingRequests
            code={code}
            token={token}
            waiting={state.waiting}
            players={state.players}
            onRefresh={refresh}
          />
        </div>
      ) : null}

      {crew ? (
        <CrewPanel
          code={code}
          token={token}
          players={state.players}
          meId={state.me.id}
          onRefresh={refresh}
          onClose={() => setCrew(false)}
        />
      ) : null}
      {online ? (
        <ChatBubble code={code} token={token} myId={state.me.id} />
      ) : null}

      {state.room.status === "lobby" ? (
        <LobbyScreen
          state={state}
          token={token}
          onHelp={() => setTutorial(true)}
          onRefresh={refresh}
        />
      ) : null}

      {state.room.status === "playing" ? (
        picking ? (
          <NextSingerScreen state={state} token={token} onRefresh={refresh} />
        ) : online ? (
          <OnlineTurnScreen state={state} token={token} onRefresh={refresh} />
        ) : (
          <LocalTurnScreen state={state} token={token} onRefresh={refresh} />
        )
      ) : null}

      {state.room.status === "done" ? (
        <VictoryScreen state={state} token={token} />
      ) : null}

      {tutorial ? <HowToPlay onClose={() => setTutorial(false)} /> : null}
    </>
  );
}
