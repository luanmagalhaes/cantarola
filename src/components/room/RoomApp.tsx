"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HowToPlay } from "@/components/game/HowToPlay";
import { LeaveButton } from "@/components/room/LeaveButton";
import { LobbyScreen } from "@/components/room/LobbyScreen";
import { LocalTurnScreen } from "@/components/room/LocalTurnScreen";
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

  const online = state.room.play_mode === "online";

  return (
    <>
      <SoundToggle />
      <LeaveButton />

      {state.room.status === "lobby" ? (
        <LobbyScreen
          state={state}
          token={token}
          onHelp={() => setTutorial(true)}
        />
      ) : null}

      {state.room.status === "playing" ? (
        online ? (
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
