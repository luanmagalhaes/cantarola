"use client";

import { useRef, useState } from "react";
import { PhotoCropper } from "@/components/ui/PhotoCropper";
import { ZoomablePhoto } from "@/components/ui/ZoomablePhoto";
import { copy } from "@/data/copy";
import { api } from "@/lib/api/client";
import { playSound } from "@/lib/sound";
import type { PlayerRow } from "@/types/game";

export function MyFace({
  code,
  token,
  me,
  onDone,
}: {
  code: string;
  token: string;
  me: PlayerRow;
  onDone: () => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [cropping, setCropping] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  function pickFile() {
    playSound("tap");
    setProblem("");
    file.current?.click();
  }

  async function send(photo: Blob) {
    setBusy(true);
    setProblem("");

    try {
      await api.setPhoto(code, token, photo);
      setCropping(null);
      onDone();
    } catch (cause) {
      setProblem(
        cause instanceof Error ? cause.message : copy.errors.generic,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed right-[4.25rem] top-[calc(0.75rem+var(--safe-top))] z-50 flex flex-col items-end gap-1.5">
      <ZoomablePhoto
        name={me.name}
        photo={me.avatar}
        emoji={me.emoji}
        size="md"
        canEdit
        busy={busy}
        onEdit={pickFile}
        className="stroke-hard hard-shadow"
      />

      <input
        ref={file}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const picked = event.target.files?.[0];

          event.target.value = "";

          if (picked) {
            setCropping(picked);
          }
        }}
      />

      {problem ? (
        <p
          role="alert"
          className="bg-coral text-paper stroke-thin max-w-[12rem] rounded-xl px-2 py-1 text-right text-xs font-bold"
        >
          {problem}
        </p>
      ) : null}

      {cropping ? (
        <PhotoCropper
          file={cropping}
          busy={busy}
          onCancel={() => setCropping(null)}
          onDone={(photo) => void send(photo)}
        />
      ) : null}
    </div>
  );
}
