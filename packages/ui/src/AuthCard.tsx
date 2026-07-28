import type { ReactNode } from "react";

export function AuthCard({
  title,
  children,
  footer,
  action,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[36rem] w-[64rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, var(--color-primary), transparent), radial-gradient(closest-side at 70% 60%, var(--color-accent), transparent)",
        }}
      />
      {action ? <div className="absolute right-4 top-4">{action}</div> : null}
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <span
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            }}
          >
            🏡
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>
        {footer ? <p className="text-center text-sm text-muted-foreground">{footer}</p> : null}
      </div>
    </main>
  );
}
