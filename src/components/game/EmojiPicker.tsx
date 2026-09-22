"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface Emoji {
  g: number;
  u: string;
  l: string;
  t: string;
  s?: Record<string, string>;
}

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
}

const groups = [
  { key: 0, icon: "😀", name: "Rostos" },
  { key: 1, icon: "👋", name: "Pessoas" },
  { key: 3, icon: "🐻", name: "Bichos" },
  { key: 4, icon: "🍔", name: "Comida" },
  { key: 5, icon: "✈️", name: "Lugares" },
  { key: 6, icon: "⚽", name: "Atividades" },
  { key: 7, icon: "💡", name: "Objetos" },
  { key: 8, icon: "❤️", name: "Símbolos" },
  { key: 9, icon: "🏁", name: "Bandeiras" },
];

const tones = [
  { key: "0", swatch: "✋" },
  { key: "1", swatch: "✋🏻" },
  { key: "2", swatch: "✋🏼" },
  { key: "3", swatch: "✋🏽" },
  { key: "4", swatch: "✋🏾" },
  { key: "5", swatch: "✋🏿" },
];

const recentKey = "la-la-la.emojis.recent";
const toneKey = "la-la-la.emojis.tone";
const maxRecent = 24;

function plain(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(recentKey);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];

    return Array.isArray(parsed) ? parsed.slice(0, maxRecent) : [];
  } catch {
    return [];
  }
}

function readTone(): string {
  try {
    return window.localStorage.getItem(toneKey) ?? "0";
  } catch {
    return "0";
  }
}

export function EmojiPicker({ onPick }: EmojiPickerProps) {
  const [catalog, setCatalog] = useState<Emoji[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [group, setGroup] = useState(0);
  const [query, setQuery] = useState("");
  const [tone, setTone] = useState(readTone);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [pickingTone, setPickingTone] = useState(false);

  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    fetch("/emojis.json")
      .then((answer) => {
        if (!answer.ok) {
          throw new Error("catalog");
        }

        return answer.json();
      })
      .then((loaded: Emoji[]) => {
        if (active) {
          setCatalog(loaded);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const searching = query.trim().length > 0;

  const shown = useMemo(() => {
    if (!catalog) {
      return [];
    }

    if (!searching) {
      return catalog.filter((emoji) => emoji.g === group);
    }

    const needle = plain(query.trim());

    return catalog
      .filter((emoji) => plain(emoji.l).includes(needle) || plain(emoji.t).includes(needle))
      .slice(0, 120);
  }, [catalog, group, query, searching]);

  useEffect(() => {
    grid.current?.scrollTo({ top: 0 });
  }, [group, query]);

  const withTone = (emoji: Emoji) => (tone === "0" ? emoji.u : (emoji.s?.[tone] ?? emoji.u));

  const choose = (value: string) => {
    onPick(value);

    const next = [value, ...recent.filter((item) => item !== value)].slice(0, maxRecent);

    setRecent(next);

    try {
      window.localStorage.setItem(recentKey, JSON.stringify(next));
    } catch {
      return;
    }
  };

  const chooseTone = (next: string) => {
    setTone(next);
    setPickingTone(false);

    try {
      window.localStorage.setItem(toneKey, next);
    } catch {
      return;
    }
  };

  if (failed) {
    return (
      <div className="shrink-0 border-t-2 border-ink/15 bg-paper px-3 py-4">
        <p className="text-center text-xs font-semibold text-ink/55">
          Não consegui carregar os emojis. Tente abrir de novo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[13.5rem] shrink-0 flex-col border-t-2 border-ink/15 bg-paper">
      <div className="flex shrink-0 items-center gap-1.5 px-2 pt-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Procurar emoji"
          autoComplete="off"
          lang="pt-BR"
          className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-cream px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-ink/35 focus:ring-4 focus:ring-grape/20"
        />
        <button
          type="button"
          onClick={() => setPickingTone((current) => !current)}
          aria-label="Escolher o tom de pele"
          className="shrink-0 cursor-pointer rounded-xl border-2 border-ink bg-paper px-2 py-1 text-base transition-colors hover:bg-sun-light"
        >
          {tones.find((item) => item.key === tone)?.swatch ?? "✋"}
        </button>
      </div>

      {pickingTone ? (
        <div className="flex shrink-0 justify-end gap-1 px-2 pt-1.5">
          {tones.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => chooseTone(item.key)}
              aria-label={`Tom ${item.key}`}
              className={`cursor-pointer rounded-lg border-2 px-1.5 py-0.5 text-base transition-transform hover:scale-110 ${
                tone === item.key ? "border-ink bg-sun-light" : "border-transparent"
              }`}
            >
              {item.swatch}
            </button>
          ))}
        </div>
      ) : null}

      <div ref={grid} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1.5">
        {!catalog ? (
          <p className="py-8 text-center text-xs font-semibold text-ink/45">Carregando emojis...</p>
        ) : (
          <>
            {!searching && recent.length > 0 ? (
              <>
                <p className="display mb-1 text-[0.6rem] uppercase tracking-[0.16em] text-ink/45">
                  Usados por último
                </p>
                <div className="mb-2 grid grid-cols-8 gap-0.5">
                  {recent.map((emoji) => (
                    <button
                      key={`recent-${emoji}`}
                      type="button"
                      onClick={() => choose(emoji)}
                      className="cursor-pointer rounded-lg py-1 text-xl transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <p className="display mb-1 text-[0.6rem] uppercase tracking-[0.16em] text-ink/45">
                  {groups.find((item) => item.key === group)?.name}
                </p>
              </>
            ) : null}

            {shown.length === 0 ? (
              <p className="py-8 text-center text-xs font-semibold text-ink/45">
                Nenhum emoji com esse nome.
              </p>
            ) : (
              <div className="grid grid-cols-8 gap-0.5">
                {shown.map((emoji) => (
                  <button
                    key={emoji.u}
                    type="button"
                    title={emoji.l}
                    onClick={() => choose(withTone(emoji))}
                    className="cursor-pointer rounded-lg py-1 text-xl transition-transform hover:scale-125"
                  >
                    {withTone(emoji)}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 justify-between gap-0.5 border-t-2 border-ink/10 px-1.5 py-1">
        {groups.map((item) => (
          <button
            key={item.key}
            type="button"
            title={item.name}
            aria-label={item.name}
            aria-pressed={!searching && group === item.key}
            onClick={() => {
              setQuery("");
              setGroup(item.key);
            }}
            className={`cursor-pointer rounded-lg px-1 py-0.5 text-base transition-transform hover:scale-110 ${
              !searching && group === item.key ? "bg-sun-light" : "opacity-55"
            }`}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
