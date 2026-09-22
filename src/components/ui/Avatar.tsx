import { initialsFor } from "@/lib/photo";

type Size = "sm" | "md" | "lg" | "xl";

const boxes: Record<Size, string> = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-28 w-28 text-3xl",
};

const glyphs: Record<Size, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
};

export function Avatar({
  name,
  photo,
  emoji = null,
  size = "md",
  className = "",
}: {
  name: string;
  photo: string | null;
  emoji?: string | null;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      className={`bg-lemon stroke-thin relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl ${boxes[size]} ${className}`}
    >
      {photo ? (
        <img src={photo} alt={name} className="h-full w-full object-cover" />
      ) : emoji ? (
        <span className={`leading-none ${glyphs[size]}`}>{emoji}</span>
      ) : (
        <span className="font-display text-grape">{initialsFor(name)}</span>
      )}
    </span>
  );
}
