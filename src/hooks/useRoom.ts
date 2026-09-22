"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type RoomState } from "@/lib/api/client";
import { browserClient } from "@/lib/supabase/browser";

const fallbackIntervalMs = 3000;
const watchedTables = ["ll_rooms", "ll_turns", "ll_results"] as const;
const playerScopedTables = ["ll_players"] as const;

export function useRoom(code: string | null, token: string | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!code || !token) {
      return;
    }

    try {
      const next = await api.state(code, token);

      setState({
        ...next,
        clockOffset: next.now ? Date.parse(next.now) - Date.now() : 0,
      });
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Deu ruim aqui. Tente de novo.",
      );
    }
  }, [code, token]);

  useEffect(() => {
    const firstLoad = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => void refresh(), fallbackIntervalMs);

    return () => {
      clearTimeout(firstLoad);
      clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    const roomId = state?.room.id;

    if (!roomId) {
      return;
    }

    const client = browserClient();
    let channel = client.channel(`room-${roomId}`);

    [...watchedTables, ...playerScopedTables].forEach((table) => {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter:
            table === "ll_rooms" ? `id=eq.${roomId}` : `room_id=eq.${roomId}`,
        },
        () => void refresh(),
      );
    });

    channel.subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [state?.room.id, refresh]);

  return { state, error, loading: state === null && error === null, refresh };
}
