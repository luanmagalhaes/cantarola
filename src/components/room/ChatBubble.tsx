"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EmojiPicker } from "@/components/game/EmojiPicker";
import { useDraggable } from "@/hooks/useDraggable";
import { useRecorder } from "@/hooks/useRecorder";
import { api } from "@/lib/api/client";
import { maxAudioSeconds, maxMessageLength } from "@/lib/game/chat";
import { countUnread, unreadLabel } from "@/lib/game/unread";
import { playSound } from "@/lib/sound";
import type { ChatMessage } from "@/types/game";

const pollMs = 2500;

function clockFor(stamp: string): string {
  const when = new Date(stamp);

  return `${String(when.getHours()).padStart(2, "0")}:${String(
    when.getMinutes(),
  ).padStart(2, "0")}`;
}

export function ChatBubble({
  code,
  token,
  myId,
}: {
  code: string;
  token: string;
  myId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [seenId, setSeenId] = useState<string | null>(null);

  const feed = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const recorder = useRecorder(maxAudioSeconds);
  const { spot, attach, settle, justDragged, handles } = useDraggable({
    x: 16,
    y: 120,
  });

  const load = useCallback(async () => {
    try {
      const { messages: fresh } = await api.chat(code, token);

      setMessages(fresh);
    } catch {
      return;
    }
  }, [code, token]);

  useEffect(() => {
    const first = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), pollMs);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    if (!open) {
      return;
    }

    feed.current?.scrollTo({
      top: feed.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  useEffect(() => {
    if (!problem) {
      return;
    }

    const timer = window.setTimeout(() => setProblem(null), 4000);

    return () => window.clearTimeout(timer);
  }, [problem]);

  const lastId = messages.length > 0 ? messages[messages.length - 1].id : null;
  const recording = recorder.status === "recording";
  const reviewing = recorder.status === "ready" && recorder.take;

  const minimize = useCallback(() => {
    setSeenId(lastId);
    setShowEmojis(false);
    setOpen(false);
  }, [lastId]);

  useEffect(() => {
    if (!open || recording || reviewing) {
      return;
    }

    const outside = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (target && !panel.current?.contains(target)) {
        minimize();
      }
    };

    document.addEventListener("pointerdown", outside);

    return () => document.removeEventListener("pointerdown", outside);
  }, [open, recording, reviewing, minimize]);

  useEffect(() => {
    const timer = window.setTimeout(() => settle(), 0);

    return () => window.clearTimeout(timer);
  }, [open, showEmojis, settle]);

  async function sendText() {
    const body = draft.trim();

    if (body.length === 0 || sending) {
      return;
    }

    setSending(true);

    try {
      const { message } = await api.sendChatText(code, token, body);

      setMessages((current) => [...current, message]);
      setDraft("");
      playSound("tap");
      field.current?.focus();
    } catch (cause) {
      setProblem(cause instanceof Error ? cause.message : "Não consegui mandar.");
    } finally {
      setSending(false);
    }
  }

  async function sendAudio() {
    if (!recorder.take || sending) {
      return;
    }

    setSending(true);

    try {
      const { message } = await api.sendChatAudio(
        code,
        token,
        recorder.take.blob,
        recorder.take.seconds,
      );

      setMessages((current) => [...current, message]);
      recorder.reset();
      playSound("card");
    } catch (cause) {
      setProblem(
        cause instanceof Error ? cause.message : "Não consegui mandar o áudio.",
      );
    } finally {
      setSending(false);
    }
  }

  const unread = open ? 0 : countUnread(messages, seenId, myId);

  if (!open) {
    return (
      <button
        type="button"
        {...handles}
        ref={attach}
        onClick={() => {
          if (justDragged()) {
            return;
          }

          playSound("tap");
          setSeenId(lastId);
          setOpen(true);
        }}
        aria-label="Abrir o chat da sala. Arraste para mudar de lugar"
        style={{ left: spot.x, top: spot.y, touchAction: "none" }}
        data-drag-root
        className="bg-lemon stroke-hard hard-shadow fixed z-[52] flex h-16 w-16 cursor-pointer items-center justify-center rounded-[1.4rem] text-2xl"
      >
        💬
        {unread > 0 ? (
          <span
            className="font-display bg-coral text-paper stroke-thin absolute -right-2 -top-2 flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-1 text-xs"
            style={{ animation: "bounce-in 0.3s both" }}
          >
            {unreadLabel(unread)}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div
      ref={(node) => {
        panel.current = node;
        attach(node);
      }}
      data-drag-root
      style={{ left: spot.x, top: spot.y }}
      className="bg-paper stroke-hard hard-shadow fixed z-[52] flex max-h-[26rem] w-[min(21rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.4rem]"
    >
      <div
        {...handles}
        className="bg-grape text-lemon flex shrink-0 cursor-grab touch-none items-center gap-2 px-3 py-2 active:cursor-grabbing"
      >
        <span className="text-lg">💬</span>
        <span className="font-display min-w-0 flex-1 truncate text-sm uppercase">
          Chat da sala
        </span>
        <button
          type="button"
          onClick={minimize}
          aria-label="Minimizar o chat"
          className="font-display bg-paper/20 text-lemon cursor-pointer rounded-lg px-2 py-0.5 text-sm"
        >
          —
        </button>
      </div>

      <div
        ref={feed}
        className="bg-cream min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5"
      >
        {messages.length === 0 ? (
          <p className="text-grape/50 py-6 text-center text-xs font-bold leading-snug">
            Ninguém falou nada ainda.
            <br />A conversa some quando a partida acaba.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {messages.map((message) => {
              const mine = message.player_id === myId;

              return (
                <li
                  key={message.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`stroke-thin max-w-[85%] rounded-2xl px-2.5 py-1.5 ${
                      mine ? "bg-lemon text-grape" : "bg-paper text-grape"
                    }`}
                  >
                    {mine ? null : (
                      <span className="font-display text-grape/60 block text-[0.65rem] uppercase">
                        {message.author_name}
                      </span>
                    )}

                    {message.kind === "audio" && message.audio_url ? (
                      <audio
                        controls
                        preload="none"
                        src={message.audio_url}
                        className="mt-0.5 h-9 w-52 max-w-full"
                      />
                    ) : (
                      <span className="block break-words text-sm font-bold leading-snug">
                        {message.body}
                      </span>
                    )}

                    <span className="text-grape/45 mt-0.5 block text-right text-[0.6rem] font-bold">
                      {clockFor(message.created_at)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {problem ? (
        <p className="bg-coral text-paper font-display shrink-0 px-3 py-1.5 text-center text-[0.7rem] uppercase">
          {problem}
        </p>
      ) : null}

      {recorder.status === "blocked" ? (
        <p className="bg-coral text-paper font-display shrink-0 px-3 py-1.5 text-center text-[0.7rem] uppercase">
          Preciso do microfone pra gravar.
        </p>
      ) : null}

      {showEmojis ? (
        <EmojiPicker
          onPick={(emoji) =>
            setDraft((current) =>
              current.length + emoji.length > maxMessageLength
                ? current
                : `${current}${emoji}`,
            )
          }
        />
      ) : null}

      <div className="border-grape/15 bg-paper shrink-0 border-t-2 p-2">
        {reviewing && recorder.take ? (
          <div className="flex flex-col gap-1.5">
            <audio controls src={recorder.take.url} className="h-9 w-full" />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playSound("tap");
                  recorder.reset();
                }}
                className="font-display stroke-thin bg-paper text-grape flex-1 cursor-pointer rounded-xl py-2 text-xs uppercase"
              >
                Apagar
              </button>
              <button
                type="button"
                onClick={() => void sendAudio()}
                disabled={sending}
                className="font-display stroke-thin bg-coral text-paper flex-[2] cursor-pointer rounded-xl py-2 text-xs uppercase disabled:opacity-50"
              >
                {sending ? "Mandando" : `Mandar ${recorder.take.seconds}s`}
              </button>
            </div>
          </div>
        ) : recording ? (
          <button
            type="button"
            onClick={() => {
              playSound("tap");
              recorder.stop();
            }}
            className="font-display stroke-thin bg-coral text-paper flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm uppercase"
            style={{ animation: "pulse-record 1s infinite" }}
          >
            Gravando {recorder.seconds}s · toque pra parar
          </button>
        ) : (
          <div className="flex items-end gap-1.5">
            <button
              type="button"
              onClick={() => setShowEmojis((current) => !current)}
              aria-label="Abrir os emojis"
              className="stroke-thin bg-paper shrink-0 cursor-pointer rounded-xl px-2 py-1.5 text-lg"
            >
              😀
            </button>

            <input
              ref={field}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void sendText();
                }
              }}
              placeholder="Manda aí"
              maxLength={maxMessageLength}
              autoComplete="off"
              lang="pt-BR"
              className="bg-cream stroke-thin text-grape placeholder:text-grape/35 min-w-0 flex-1 rounded-xl px-2.5 py-2 text-sm font-bold outline-none"
            />

            {draft.trim().length > 0 ? (
              <button
                type="button"
                onClick={() => void sendText()}
                disabled={sending}
                aria-label="Mandar a mensagem"
                className="stroke-thin bg-coral text-paper shrink-0 cursor-pointer rounded-xl px-3 py-2 text-sm disabled:opacity-50"
              >
                ➤
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  playSound("tap");
                  void recorder.start();
                }}
                aria-label="Gravar um áudio"
                className="stroke-thin bg-mint shrink-0 cursor-pointer rounded-xl px-3 py-2 text-lg"
              >
                🎤
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
