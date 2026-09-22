"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { RoomApp } from "@/components/room/RoomApp";

export default function Page() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").replace(/\D/g, "");

  return (
    <Suspense fallback={null}>
      <RoomApp code={code} />
    </Suspense>
  );
}
