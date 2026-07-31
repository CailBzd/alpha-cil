import { createServerSupabaseClient } from "@alpha-cil/db";
import { PERSONA_ESPACE_PATH, resolvePersona } from "@/lib/persona";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppHeader } from "../../../../AppHeader";
import { ThemeToggle } from "../../../../theme-toggle";
import { EspaceSidebar } from "../EspaceSidebar";
import { SignOutButton } from "../SignOutButton";
import { ArtisanRendezVousRow } from "./ArtisanRendezVousRow";

export default async function ArtisanRendezVousPage() {
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

  const { data: rendezVous } = await supabase
    .from("rendez_vous")
    .select("id, type_travaux, date_prevue, statut, notes, adresse_logement")
    .order("date_prevue", { ascending: true });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader>
        <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
        <ThemeToggle />
        <SignOutButton />
      </AppHeader>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 sm:flex-row sm:gap-8">
        <EspaceSidebar />
        <main className="min-w-0 flex-1 space-y-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Mes rendez-vous</h1>
          {rendezVous && rendezVous.length > 0 ? (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {rendezVous.map((rdv) => (
                <ArtisanRendezVousRow
                  key={rdv.id}
                  rendezVous={{
                    id: rdv.id,
                    type_travaux: rdv.type_travaux,
                    date_prevue: rdv.date_prevue,
                    statut: rdv.statut,
                    notes: rdv.notes,
                    adresse: rdv.adresse_logement,
                  }}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun rendez-vous ne vous a été associé pour l&apos;instant.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
