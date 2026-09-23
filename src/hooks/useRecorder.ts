"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { measureDuration } from "@/lib/audio";
import { withDuration } from "@/lib/webm";

export type RecorderStatus = "idle" | "recording" | "ready" | "blocked";

const minUsefulBytes = 1024;

const candidateTypes = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function bestMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return candidateTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export interface Take {
  blob: Blob;
  url: string;
  seconds: number;
  measuredMs: number | null;
  heldMs: number;
}

export function useRecorder(maxSeconds: number) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [take, setTake] = useState<Take | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const startingRef = useRef(false);
  const urlRef = useRef<string | null>(null);

  const releaseUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const start = useCallback(async () => {
    const running = recorderRef.current;

    if (startingRef.current || (running && running.state !== "inactive")) {
      return;
    }

    startingRef.current = true;
    releaseUrl();
    setTake(null);
    setProblem(null);
    setSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = bestMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      chunksRef.current = [];
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());

        if (recorderRef.current !== recorder) {
          return;
        }

        const type = recorder.mimeType.split(";")[0] || "audio/webm";
        const raw = new Blob(chunksRef.current, { type });
        const heldMs = Date.now() - startedAtRef.current;
        const elapsed = Math.max(1, Math.round(heldMs / 1000));

        if (raw.size < minUsefulBytes) {
          setProblem(
            "Não saiu áudio nenhum. Se estiver em ligação, encerre antes de gravar.",
          );
          setStatus("idle");
          return;
        }

        void (async () => {
          const measured = await measureDuration(raw);
          const trueMs = measured ?? heldMs;

          const sane =
            measured !== null && heldMs > 0 && measured >= heldMs * 0.6;
          const headerMs = sane ? (measured as number) : heldMs;
          const blob =
            type === "audio/webm" ? await withDuration(raw, headerMs) : raw;
          const url = URL.createObjectURL(blob);

          urlRef.current = url;
          setTake({
            blob,
            url,
            seconds: Math.min(
              Math.max(1, Math.round(headerMs / 1000)),
              maxSeconds,
            ),
            measuredMs: measured,
            heldMs,
          });
          setStatus("ready");
        })();
      };

      recorder.start();
      setStatus("recording");
    } catch {
      setProblem("Preciso do microfone. Libere nos ajustes e tente de novo.");
      setStatus("blocked");
    } finally {
      startingRef.current = false;
    }
  }, [maxSeconds, releaseUrl]);

  const reset = useCallback(() => {
    releaseUrl();
    setTake(null);
    setProblem(null);
    setSeconds(0);
    setStatus("idle");
  }, [releaseUrl]);

  useEffect(() => {
    if (status !== "recording") {
      return;
    }

    const timer = setInterval(() => {
      setSeconds(Math.round((Date.now() - startedAtRef.current) / 1000));
    }, 250);

    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === "recording" && seconds >= maxSeconds) {
      stop();
    }
  }, [status, seconds, maxSeconds, stop]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }

      releaseUrl();
    };
  }, [releaseUrl]);

  return { status, seconds, take, problem, start, stop, reset };
}
