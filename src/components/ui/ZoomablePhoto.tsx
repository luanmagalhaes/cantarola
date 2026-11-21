"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { PhotoViewer } from "@/components/ui/PhotoViewer";

type AvatarProps = Parameters<typeof Avatar>[0];

type Props = AvatarProps & {
  canEdit?: boolean;
  busy?: boolean;
  onEdit?: () => void;
};

function openLabelFor(name: string, photo: string | null): string {
  return photo ? `Ver a foto de ${name}` : `Pôr uma foto de ${name}`;
}

export function ZoomablePhoto({
  canEdit = false,
  busy = false,
  onEdit,
  ...avatar
}: Props) {
  const [open, setOpen] = useState(false);

  if (!avatar.photo && !canEdit) {
    return <Avatar {...avatar} />;
  }

  return (
    <>
      {open ? (
        <PhotoViewer
          name={avatar.name}
          photo={avatar.photo}
          emoji={avatar.emoji}
          canEdit={canEdit}
          busy={busy}
          onEdit={() => {
            setOpen(false);
            onEdit?.();
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={openLabelFor(avatar.name, avatar.photo)}
        className="shrink-0 rounded-2xl transition-transform active:scale-95"
      >
        <Avatar {...avatar} />
      </button>
    </>
  );
}
