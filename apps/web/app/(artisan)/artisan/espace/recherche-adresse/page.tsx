import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppHeader } from "../../../../AppHeader";
import { ThemeToggle } from "../../../../theme-toggle";
import { SignOutButton } from "../SignOutButton";
import { AdresseRechercheForm } from "./AdresseRechercheForm";

export default async function RechercheAdressePage() {
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader>
        <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
        <ThemeToggle />
        <SignOutButton />
      </AppHeader>
      <div className="mx-auto flex max-w-5xl gap-8 px-6 py-8">
        <nav className="w-48 shrink-0 space-y-1">
          <a
            href="/artisan/espace"
            className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
          >
            Mes interventions
          </a>
          <a
            href="/artisan/espace/rendez-vous"
            className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
          >
            Mes rendez-vous
          </a>
          <a
            href="/artisan/espace/recherche-adresse"
            className="block rounded-md px-3 py-2 text-sm font-medium text-white shadow-sm"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            }}
          >
            Rechercher une adresse
          </a>
          <a
            href="/artisan/espace/profil"
            className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
          >
            Mon profil
          </a>
        </nav>
        <main className="flex-1 space-y-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Rechercher une adresse
          </h1>
          <AdresseRechercheForm />
        </main>
      </div>
    </div>
  );
}
