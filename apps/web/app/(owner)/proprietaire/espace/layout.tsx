import { createServerSupabaseClient } from "@alpha-cil/db";
import { PERSONA_ESPACE_PATH, resolvePersona } from "@/lib/persona";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "../../../AppHeader";
import { ThemeToggle } from "../../../theme-toggle";
import { EspaceSidebar } from "./EspaceSidebar";
import { SignOutButton } from "./SignOutButton";

export default async function EspaceProprietaireLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Server Components can't write cookies. middleware.ts refreshes
        // the session and writes fresh cookies on every request, so a
        // write attempted here is safe to ignore.
      }
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/proprietaire/connexion");
  }

  const persona = await resolvePersona(supabase, user.id);
  if (persona !== "proprietaire") {
    redirect(PERSONA_ESPACE_PATH[persona]);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader>
        <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
        <ThemeToggle />
        <SignOutButton />
      </AppHeader>
      <div className="mx-auto flex max-w-5xl gap-8 px-6 py-8">
        <EspaceSidebar />
        <main className="min-w-0 flex-1 space-y-4">{children}</main>
      </div>
    </div>
  );
}
