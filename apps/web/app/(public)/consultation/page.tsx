import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { AppHeader } from "../../AppHeader";
import { LogementReadOnlyView, type ReadOnlyIntervention } from "../../LogementReadOnlyView";
import { ThemeToggle } from "../../theme-toggle";

interface GrantValidation {
  logement_id: string | null;
  adresse: string | null;
  chauffage_type: string[] | null;
  vmc_type: string | null;
  scope: string | null;
  tiers_type: string | null;
  valid: boolean;
}

export default async function ConsultationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll: () => {
      // No session to persist on this fully public, unauthenticated page.
    },
  });

  let validation: GrantValidation | null = null;
  let interventions: ReadOnlyIntervention[] = [];

  if (token) {
    const { data } = await supabase.rpc("validate_access_grant", { p_token: token });
    validation = data?.[0] ?? null;

    if (validation?.valid) {
      const { data: list } = await supabase.rpc("list_granted_interventions", { p_token: token });
      interventions = list ?? [];
    }
  }

  if (!validation?.valid) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader>
          <ThemeToggle />
        </AppHeader>
        <main className="mx-auto max-w-lg px-4 py-12">
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Ce lien de consultation est invalide, expiré, ou a été révoqué.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader>
        <ThemeToggle />
      </AppHeader>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-12">
        <p className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          {validation.tiers_type === "agence"
            ? "Consultation agence immobilière — lecture seule, aucune modification possible."
            : "Consultation en lecture seule — aucune modification possible."}
        </p>
        <LogementReadOnlyView
          adresse={validation.adresse}
          chauffageType={validation.chauffage_type}
          vmcType={validation.vmc_type}
          showDetails={validation.scope === "total"}
          interventions={interventions}
        />
      </main>
    </div>
  );
}
