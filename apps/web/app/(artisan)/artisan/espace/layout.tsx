import { PERSONA_ESPACE_PATH, resolvePersona } from "@/lib/persona";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "../../../AppHeader";
import { ThemeToggle } from "../../../theme-toggle";
import { EspaceSidebar } from "./EspaceSidebar";
import { SignOutButton } from "./SignOutButton";

export default async function EspaceArtisanLayout({ children }: { children: ReactNode }) {
  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/artisan/connexion");
  }

  const persona = await resolvePersona(supabase, user.id);
  if (persona !== "artisan") {
    redirect(PERSONA_ESPACE_PATH[persona]);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader>
        <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
        <ThemeToggle />
        <SignOutButton />
      </AppHeader>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 sm:flex-row sm:gap-8">
        <EspaceSidebar />
        <main className="min-w-0 flex-1 space-y-4">{children}</main>
      </div>
    </div>
  );
}
