"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { api, type TeamSongLog, type SongLogItem } from "@/lib/api/client";
import { copy } from "@/data/copy";
import type { Outcome, Team } from "@/types/game";

const teamSkins: Record<Team, string> = {
  red: "bg-team-red",
  blue: "bg-team-blue",
};

const missLabels: Record<Outcome, string> = {
  hit: "acertou",
  stolen: "roubada pelo outro time",
  missed: "ninguém acertou",
  skipped: "passou",
};

function SongList({
  items,
  empty,
  hits,
}: {
  items: SongLogItem[];
  empty: string;
  hits: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="font-display text-grape rounded-xl border-2 border-dashed border-current px-3 py-2 text-center text-xs uppercase opacity-50">
        {empty}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, index) => (
        <li
          key={`${item.title}-${index}`}
          className="bg-cream stroke-thin flex items-center gap-2 rounded-xl px-3 py-1.5"
        >
          <span className="min-w-0 flex-1">
            <span className="font-display text-grape block truncate text-sm uppercase leading-tight">
              {item.title}
            </span>
            <span className="text-grape block truncate text-[10px] font-bold uppercase opacity-70">
              {item.artist}
            </span>
          </span>
          <span
            className={`font-display stroke-thin shrink-0 rounded-md px-1.5 py-0.5 text-[9px] uppercase ${
              hits
                ? item.outcome === "stolen"
                  ? "bg-team-blue text-paper"
                  : "bg-mint text-paper"
                : "bg-paper text-grape"
            }`}
          >
            {hits
              ? item.outcome === "stolen"
                ? "roubo"
                : "acertou"
              : missLabels[item.outcome]}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TeamSongsModal({
  team,
  code,
  token,
  onClose,
}: {
  team: Team;
  code: string;
  token: string;
  onClose: () => void;
}) {
  const [log, setLog] = useState<TeamSongLog | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;

    api
      .songLog(code, token)
      .then((payload) => {
        if (alive) {
          setLog(payload.log[team]);
        }
      })
      .catch(() => {
        if (alive) {
          setFailed(true);
        }
      });

    return () => {
      alive = false;
    };
  }, [code, token, team]);

  return (
    <div className="bg-grape/85 fixed inset-0 z-[85] flex items-end justify-center p-3 sm:items-center">
      <div
        className="bg-paper stroke-hard flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-3xl shadow-[0_12px_0_var(--color-grape)]"
        style={{ animation: "bounce-in 0.4s both" }}
      >
        <div className={`shrink-0 px-4 py-3 text-center ${teamSkins[team]}`}>
          <p className="font-display text-paper text-2xl uppercase leading-tight">
            Time {copy.teams[team]}
          </p>
          <p className="text-paper text-xs font-bold opacity-90">
            As músicas das vezes que já acabaram
          </p>
        </div>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {failed ? (
            <p className="font-display text-grape text-center text-sm uppercase opacity-70">
              Não consegui buscar as músicas. Tente de novo.
            </p>
          ) : log === null ? (
            <p className="font-display text-grape text-center text-sm uppercase opacity-70">
              Buscando as músicas...
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <section>
                <h3 className="font-display text-grape mb-2 text-sm uppercase">
                  Acertadas ({log.hits.length})
                </h3>
                <SongList items={log.hits} empty="Nenhuma ainda" hits />
              </section>
              <section>
                <h3 className="font-display text-grape mb-2 text-sm uppercase">
                  Não acertadas ({log.misses.length})
                </h3>
                <SongList
                  items={log.misses}
                  empty="Nenhuma ainda"
                  hits={false}
                />
              </section>
            </div>
          )}
        </div>

        <div className="shrink-0 px-4 pb-4">
          <Button color="paper" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
