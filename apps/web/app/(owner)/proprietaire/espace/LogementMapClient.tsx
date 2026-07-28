"use client";

import dynamic from "next/dynamic";

const LogementMap = dynamic(() => import("./LogementMap").then((mod) => mod.LogementMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
      Chargement de la carte…
    </div>
  ),
});

export function LogementMapClient({ adresse }: { adresse: string }) {
  return <LogementMap adresse={adresse} />;
}
