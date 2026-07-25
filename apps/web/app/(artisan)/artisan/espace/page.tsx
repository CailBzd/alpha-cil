import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "../../../theme-toggle";
import { SignOutButton } from "./SignOutButton";

export default async function EspaceArtisanPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      for (const { name, value, options } of cookiesToSet) {
        cookieStore.set(name, value, options);
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
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="font-semibold tracking-tight text-foreground">Alpha CIL</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <div className="mx-auto flex max-w-5xl gap-8 px-6 py-8">
        <nav className="w-48 shrink-0">
          <a
            href="/artisan/espace"
            className="block rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground"
          >
            Mes interventions
          </a>
        </nav>
        <main className="flex-1 space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Bienvenue</h1>
          <p className="text-sm text-muted-foreground">
            Soumettez votre première intervention pour commencer.
          </p>
        </main>
      </div>
    </div>
  );
}
