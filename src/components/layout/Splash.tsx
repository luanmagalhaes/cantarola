"use client";

import { Wordmark } from "@/components/ui/Wordmark";

const notes = [
  { left: "12%", delay: "0s", size: "text-4xl" },
  { left: "28%", delay: "0.7s", size: "text-3xl" },
  { left: "62%", delay: "0.3s", size: "text-5xl" },
  { left: "80%", delay: "1.1s", size: "text-3xl" },
  { left: "45%", delay: "1.5s", size: "text-4xl" },
];

export function Splash({ leaving }: { leaving: boolean }) {
  return (
    <div
      className="confetti-dots bg-cream fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={
        leaving ? { animation: "splash-out 0.5s ease-in forwards" } : undefined
      }
    >
      {notes.map((note) => (
        <span
          key={note.left}
          aria-hidden="true"
          className={`text-gold absolute bottom-24 ${note.size}`}
          style={{
            left: note.left,
            animation: `note-float 2.6s ${note.delay} ease-out infinite`,
          }}
        >
          ♪
        </span>
      ))}

      <div
        className="relative z-10 w-full px-4 py-6"
        style={{ animation: "bounce-in 0.9s 0.1s both" }}
      >
        <Wordmark size="lg" />
      </div>
    </div>
  );
}
