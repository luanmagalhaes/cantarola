"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { copy } from "@/data/copy";
import { deckSizes } from "@/data/songs";
import { minPlayers, songsPerTurn } from "@/lib/game/rules";

function Good({ children }: { children: ReactNode }) {
  return (
    <strong className="font-display text-mint font-normal">{children}</strong>
  );
}

function Bad({ children }: { children: ReactNode }) {
  return (
    <strong className="font-display text-coral font-normal">{children}</strong>
  );
}

function Chip({
  children,
  tone = "bg-paper text-grape",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span
      className={`font-display stroke-thin rounded-lg px-2 py-1 text-xs uppercase ${tone}`}
    >
      {children}
    </span>
  );
}

interface Slide {
  title: string;
  tone: string;
  art: ReactNode;
  body: ReactNode;
}

const slides: Slide[] = [
  {
    title: "Presta atenção, benção!",
    tone: "bg-grape text-lemon",
    art: (
      <p className="text-5xl" aria-hidden="true">
        🎤
      </p>
    ),
    body: (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-base font-bold leading-snug">
          Você recebe {songsPerTurn} músicas e cantarola cada uma{" "}
          <Bad>só com lá lá lá</Bad>. Seu time tem que gritar o nome.
        </p>
        <div className="bg-lemon stroke-hard rounded-2xl p-3">
          <p className="font-display text-xl uppercase leading-tight">
            Nada de falar a letra
          </p>
          <p className="mt-1 text-xs font-bold">
            Nem o nome, nem o refrão, nem o artista. Só a melodia.
          </p>
        </div>
        <div className="bg-mint stroke-hard rounded-2xl p-3">
          <p className="font-display text-xl uppercase leading-tight">
            Cantar junto já vale
          </p>
          <p className="mt-1 text-xs font-bold">
            No presencial ninguém precisa dizer o título. Se o time sacou pelo
            lá lá lá e emendou na música, <Good>é ponto</Good>.
          </p>
        </div>
        <p className="text-sm font-bold leading-snug opacity-80">
          Não precisa afinar. Quanto pior, mais engraçado.
        </p>
      </div>
    ),
  },
  {
    title: "Duas versões",
    tone: "bg-amber text-grape",
    art: (
      <div className="flex items-center justify-center gap-2">
        <Chip tone="bg-lemon text-grape">Presencial</Chip>
        <Chip tone="bg-coral text-paper">Online</Chip>
      </div>
    ),
    body: (
      <div className="flex flex-col gap-2.5">
        <div className="bg-paper stroke-hard rounded-2xl p-3">
          <p className="font-display text-lg uppercase">
            {copy.modes.local.title}
          </p>
          <p className="text-xs font-bold">
            Todo mundo junto. Você canta ao vivo e tem{" "}
            <Good>60 segundos</Good> pra emplacar o máximo de músicas.
          </p>
        </div>
        <div className="bg-paper stroke-hard rounded-2xl p-3">
          <p className="font-display text-lg uppercase">
            {copy.modes.online.title}
          </p>
          <p className="text-xs font-bold">
            Cada um na sua casa. Você grava um áudio por música, o time ouve e{" "}
            <strong>escreve o palpite</strong>. São <Good>90 segundos</Good>.
          </p>
        </div>
        <div className="border-grape/40 rounded-2xl border-2 border-dashed p-3">
          <p className="text-xs font-bold">
            A versão é escolhida por quem cria a sala. Quem entra pelo código
            já cai na versão certa.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Só você vê a lista",
    tone: "bg-team-blue text-paper",
    art: (
      <p className="text-5xl" aria-hidden="true">
        🙈
      </p>
    ),
    body: (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-base font-bold leading-snug">
          As músicas da rodada aparecem <Bad>só no celular de quem canta</Bad>.
          O resto da sala não consegue espiar.
        </p>
        <div className="bg-gold stroke-hard text-grape rounded-2xl p-3">
          <p className="font-display text-lg uppercase leading-tight">
            Não conhece a música?
          </p>
          <p className="mt-1 text-xs font-bold">
            Toque no ♪ e ouça um pedacinho. Mas{" "}
            <strong>coloque o fone</strong> — se o time escutar, acabou a
            graça.
          </p>
        </div>
        <p className="text-sm font-bold leading-snug opacity-80">
          Quando a rodada acaba, todo mundo vê o que era cada uma.
        </p>
      </div>
    ),
  },
  {
    title: "Os botões da rodada",
    tone: "bg-coral text-paper",
    art: (
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <Chip tone="bg-mint text-paper">Acertou</Chip>
        <Chip>Passar</Chip>
        <Chip tone="bg-team-blue text-paper">Roubou</Chip>
      </div>
    ),
    body: (
      <div className="flex flex-col gap-2.5">
        <div className="bg-paper stroke-hard rounded-2xl p-3">
          <p className="font-display text-mint text-lg uppercase">Acertou</p>
          <p className="text-xs font-bold">
            Quem canta aperta quando o time acerta — gritando o nome ou{" "}
            <Good>cantando junto</Good>. Vale <Good>um ponto</Good>.
          </p>
        </div>
        <div className="bg-paper stroke-hard rounded-2xl p-3">
          <p className="font-display text-lg uppercase">Passar</p>
          <p className="text-xs font-bold">
            Música difícil sai da rodada e <strong>ninguém pontua</strong>.
          </p>
        </div>
        <div className="bg-paper stroke-hard rounded-2xl p-3">
          <p className="font-display text-team-blue text-lg uppercase">
            {copy.steal.name}
          </p>
          <p className="text-xs font-bold">
            Acabou o tempo com música sobrando? O{" "}
            <Bad>time adversário</Bad> tenta uma. Acertou, o ponto é dele.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Modos extras",
    tone: "bg-gold text-grape",
    art: (
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <Chip>Assovio</Chip>
        <Chip>Boca fechada</Chip>
        <Chip tone="bg-coral text-paper">Bomba</Chip>
        <Chip tone="bg-team-blue text-paper">Duelo</Chip>
      </div>
    ),
    body: (
      <div className="flex flex-col gap-2.5">
        <p className="text-center text-sm font-bold leading-snug">
          Quem cria a sala liga os que quiser. A cada rodada pode cair um deles
          — ou nenhum.
        </p>
        {(["whistle", "hum", "bomb", "duel"] as const).map((twist) => (
          <div key={twist} className="bg-paper stroke-hard rounded-2xl p-3">
            <p className="font-display text-lg uppercase">
              {copy.twists[twist].name}
            </p>
            <p className="text-xs font-bold">{copy.twists[twist].description}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Escolha o repertório",
    tone: "bg-mint text-paper",
    art: (
      <div className="flex items-center justify-center gap-1.5">
        <Chip>Nacional</Chip>
        <Chip>Internacional</Chip>
        <Chip tone="bg-gold text-grape">Misto</Chip>
      </div>
    ),
    body: (
      <div className="flex flex-col gap-2.5 text-center">
        {(["national", "international", "mixed"] as const).map((mode) => (
          <div key={mode} className="bg-paper stroke-hard rounded-2xl p-3">
            <p className="font-display text-lg uppercase">
              {copy.decks[mode].name}
            </p>
            <p className="text-xs font-bold">
              {deckSizes[mode]} músicas. {copy.decks[mode].description}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Como termina",
    tone: "bg-team-red text-paper",
    art: (
      <div className="flex items-center justify-center gap-2">
        {["6", "0", "s"].map((piece) => (
          <span
            key={piece}
            className="font-display bg-paper text-grape stroke-hard flex h-14 w-11 items-center justify-center rounded-xl text-2xl"
          >
            {piece}
          </span>
        ))}
      </div>
    ),
    body: (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-base font-bold leading-snug">
          A vez passa de um time para o outro até que{" "}
          <Good>todo mundo tenha cantado</Good>.
        </p>
        <div className="bg-lemon stroke-hard text-grape rounded-2xl p-3">
          <p className="font-display text-lg uppercase leading-tight">
            Ganha quem fizer mais pontos
          </p>
          <p className="mt-1 text-xs font-bold">
            Se der número ímpar, alguém do outro time canta de novo pra empatar
            as rodadas.
          </p>
        </div>
        <p className="text-sm font-bold leading-snug opacity-90">
          Dá pra jogar a partir de {minPlayers} pessoas. No um contra um, quem
          não está cantando é quem adivinha — e leva o ponto.
        </p>
      </div>
    ),
  },
];

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div className="bg-grape/85 fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center">
      <div
        className="bg-cream stroke-hard flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-3xl shadow-[0_12px_0_var(--color-grape)]"
        style={{ animation: "bounce-in 0.45s both" }}
      >
        <div className={`shrink-0 px-4 pb-4 pt-5 text-center ${slide.tone}`}>
          {slide.art}
          <h2 className="font-display mt-3 text-2xl uppercase leading-tight">
            {slide.title}
          </h2>
        </div>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {slide.body}
        </div>

        <div className="border-grape/10 shrink-0 border-t-2 px-4 pb-4 pt-3">
          <div className="mb-3 flex items-center justify-center gap-1.5">
            {slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setStep(index)}
                aria-label={`Ir para a parte ${index + 1}: ${item.title}`}
                aria-current={index === step}
                className={`font-display stroke-thin flex h-7 w-6 items-center justify-center rounded-md text-xs transition-transform duration-200 ${
                  index === step
                    ? "bg-coral text-paper scale-110"
                    : "bg-paper text-grape/40"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className={`flex gap-2 ${isLast ? "flex-col" : ""}`}>
            {isLast ? (
              <>
                <Button color="coral" onClick={onClose}>
                  <span className="text-lg">Valeu, pai. Entendido</span>
                </Button>
                <Button color="paper" onClick={() => setStep(step - 1)}>
                  <span className="text-lg">Voltar</span>
                </Button>
              </>
            ) : (
              <>
                {step > 0 ? (
                  <Button color="paper" onClick={() => setStep(step - 1)}>
                    Voltar
                  </Button>
                ) : null}
                <Button color="grape" onClick={() => setStep(step + 1)}>
                  Saquei
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
