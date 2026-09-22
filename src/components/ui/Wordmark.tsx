import { copy } from "@/data/copy";

type Size = "lg" | "md" | "sm";

const scales: Record<Size, { row: string; badge: string }> = {
  lg: {
    row: "text-[16vw] leading-[1.02] sm:text-[6rem]",
    badge: "text-sm px-4 py-1.5",
  },
  md: {
    row: "text-[11vw] leading-[1.02] sm:text-[4rem]",
    badge: "text-xs px-3 py-1",
  },
  sm: {
    row: "text-[7vw] leading-[1.05] sm:text-2xl",
    badge: "text-[10px] px-2 py-0.5",
  },
};

export function Wordmark({
  size = "lg",
  withTagline = true,
}: {
  size?: Size;
  withTagline?: boolean;
}) {
  const scale = scales[size];

  return (
    <div className="flex select-none flex-col items-center px-[0.2em]">
      <span
        className={`font-display text-lemon outline-text inline-block px-[0.08em] ${scale.row} -rotate-3`}
      >
        {copy.brand.firstLine}
      </span>
      <span
        className={`font-display text-coral outline-text -mt-[0.18em] inline-block px-[0.08em] ${scale.row} rotate-2`}
      >
        {copy.brand.secondLine}
      </span>
      {withTagline ? (
        <span
          className={`font-display bg-grape text-lemon stroke-thin hard-shadow mt-3 -rotate-1 rounded-xl uppercase tracking-wide ${scale.badge}`}
        >
          {copy.brand.tagline}
        </span>
      ) : null}
    </div>
  );
}
