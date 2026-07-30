import { createServerSupabaseClient } from "@alpha-cil/db";
import { PERSONA_ESPACE_PATH, resolvePersona } from "@/lib/persona";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "../../../../../AppHeader";
import { ThemeToggle } from "../../../../../theme-toggle";
import { SignOutButton } from "../../SignOutButton";
import { InterventionForm } from "./InterventionForm";

export default async function NouvelleInterventionPage() {
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
      <main className="mx-auto max-w-lg px-4 py-12">
        <div className="space-y-1">
          <Link
            href="/artisan/espace"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            &larr; Retour à mon espace
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Soumettre une intervention
          </h1>
        </div>
        <InterventionForm />
      </main>
    </div>
  );
}
