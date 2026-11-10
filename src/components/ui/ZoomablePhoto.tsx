"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { PhotoViewer } from "@/components/ui/PhotoViewer";

type AvatarProps = Parameters<typeof Avatar>[0];

export function ZoomablePhoto(props: AvatarProps) {
  const [open, setOpen] = useState(false);

  if (!props.photo) {
    return <Avatar {...props} />;
  }

  return (
    <>
      {open ? <PhotoViewer name={props.name} photo={props.photo} onClose={() => setOpen(false)} /> : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ver a foto de ${props.name}`}
        className="shrink-0 rounded-2xl transition-transform active:scale-95"
      >
        <Avatar {...props} />
      </button>
    </>
  );
}
