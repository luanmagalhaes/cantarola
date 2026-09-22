"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { playSound } from "@/lib/sound";

type Color = "lemon" | "gold" | "coral" | "grape" | "paper" | "mint";

const colors: Record<Color, string> = {
  lemon: "bg-lemon text-grape",
  gold: "bg-gold text-grape",
  coral: "bg-coral text-paper",
  grape: "bg-grape text-lemon",
  paper: "bg-paper text-grape",
  mint: "bg-mint text-paper",
};

type Size = "md" | "sm";

const sizes: Record<Size, string> = {
  md: "px-6 py-4 text-2xl",
  sm: "px-3 py-2.5 text-base",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: Color;
  width?: "full" | "auto";
  size?: Size;
};

export function Button({
  color = "paper",
  width = "full",
  size = "md",
  className = "",
  children,
  onClick,
  ...rest
}: Props) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    playSound("tap");
    onClick?.(event);
  }

  return (
    <button
      onClick={handleClick}
      className={`font-display stroke-hard hard-shadow rounded-2xl uppercase tracking-wide transition-transform duration-100 active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_var(--color-grape)] disabled:opacity-50 ${
        sizes[size]
      } ${colors[color]} ${width === "full" ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
