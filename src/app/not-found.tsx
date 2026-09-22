import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";

export default function NotFound() {
  return (
    <main className="confetti-dots bg-cream flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-10">
      <Wordmark size="md" withTagline={false} />

      <div className="bg-paper stroke-hard hard-shadow w-full max-w-sm rounded-3xl px-5 py-6 text-center">
        <p className="font-display text-coral text-5xl leading-none uppercase">
          Ops
        </p>
        <p className="font-display mt-2 text-xl uppercase leading-tight">
          Essa página não existe
        </p>
        <p className="mt-2 text-sm font-bold opacity-70">
          Confira o endereço ou volte para o começo e entre pelo código da sala.
        </p>
      </div>

      <Link
        href="/"
        className="font-display bg-coral text-paper stroke-hard hard-shadow w-full max-w-sm rounded-2xl px-6 py-4 text-center text-2xl uppercase tracking-wide"
      >
        Ir para o começo
      </Link>
    </main>
  );
}
