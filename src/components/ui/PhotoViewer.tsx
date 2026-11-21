"use client";

import { useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { copy } from "@/data/copy";

interface PhotoViewerProps {
  name: string;
  photo: string | null;
  emoji?: string | null;
  canEdit?: boolean;
  busy?: boolean;
  onEdit?: () => void;
  onClose: () => void;
}

function editLabelFor(photo: string | null, busy: boolean): string {
  if (busy) {
    return copy.avatar.sending;
  }

  return photo ? copy.avatar.change : copy.avatar.add;
}

export function PhotoViewer({
  name,
  photo,
  emoji = null,
  canEdit = false,
  busy = false,
  onEdit,
  onClose,
}: PhotoViewerProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de ${name}`}
      onClick={onClose}
      className="photo-veil fixed inset-0 z-[64] flex flex-col overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))]"
      style={{ animation: "veil-in 0.2s ease-out both" }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="m-auto flex w-full max-w-xs shrink-0 flex-col items-center gap-3"
        style={{ animation: "photo-pop 0.35s both" }}
      >
        <span className="bg-paper stroke-hard hard-shadow flex w-full items-center justify-center overflow-hidden rounded-[1.75rem] p-1.5">
          {photo ? (
            <img
              src={photo}
              alt={`Foto de ${name}`}
              className="block max-h-[56dvh] w-full rounded-[1.25rem] object-contain"
            />
          ) : (
            <Avatar
              name={name}
              photo={null}
              emoji={emoji}
              size="xl"
              className="my-5"
            />
          )}
        </span>

        <span className="font-display bg-paper text-grape stroke-thin rounded-xl px-4 py-1.5 text-center text-lg uppercase leading-tight">
          {name}
        </span>

        {canEdit ? (
          <>
            <Button color="gold" size="sm" disabled={busy} onClick={onEdit}>
              {editLabelFor(photo, busy)}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="font-display text-paper/80 flex min-h-11 items-center justify-center px-4 text-sm uppercase"
            >
              {copy.avatar.close}
            </button>
          </>
        ) : (
          <span className="text-paper/70 text-xs font-bold">
            {copy.avatar.closeHint}
          </span>
        )}
      </div>
    </div>
  );
}
