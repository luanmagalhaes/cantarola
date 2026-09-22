"use client";

import { useEffect, useState } from "react";
import { Splash } from "@/components/layout/Splash";
import { HomeScreen } from "@/components/home/HomeScreen";

type Phase = "splash" | "leaving" | "home";

export default function Page() {
  const [phase, setPhase] = useState<Phase>("splash");

  useEffect(() => {
    const toLeaving = setTimeout(() => setPhase("leaving"), 2100);
    const toHome = setTimeout(() => setPhase("home"), 2600);

    return () => {
      clearTimeout(toLeaving);
      clearTimeout(toHome);
    };
  }, []);

  return (
    <>
      {phase === "home" ? null : <Splash leaving={phase === "leaving"} />}
      <HomeScreen />
    </>
  );
}
