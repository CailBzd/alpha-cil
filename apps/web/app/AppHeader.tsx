import Link from "next/link";
import type { ReactNode } from "react";

export function AppHeader({ children }: { children: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            }}
          >
            🏡
          </span>
          Alpha CIL
        </Link>
        <div className="flex items-center gap-4">{children}</div>
      </div>
    </header>
  );
}
