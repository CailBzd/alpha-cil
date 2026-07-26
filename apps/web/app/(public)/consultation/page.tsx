import { createServerSupabaseClient } from "@alpha-cil/db";
import { CHAUFFAGE_OPTIONS, VMC_OPTIONS } from "@/lib/equipements";
import { cookies } from "next/headers";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });
const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

function chauffageLabel(value: string) {
  return CHAUFFAGE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function vmcLabel(value: string) {
  return VMC_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

interface GrantValidation {
  logement_id: string | null;
  adresse: string | null;
  chauffage_type: string | null;
  vmc_type: string | null;
  scope: string | null;
  valid: boolean;
}

interface GrantedIntervention {
  id: string;
  type_travaux: string;
  date_intervention: string;
  artisan_siret: string | null;
  rge_verifie: boolean;
  rge_verifie_a: string | null;
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
  let interventions: GrantedIntervention[] = [];

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
      <main className="mx-auto max-w-lg px-4 py-12">
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Ce lien de consultation est invalide, expiré, ou a été révoqué.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-12">
      <p className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
        Consultation en lecture seule — aucune modification possible.
      </p>
      {validation.scope === "total" ? (
        <div className="space-y-1 text-sm">
          <p className="text-foreground">{validation.adresse}</p>
          <p className="text-muted-foreground">
            Chauffage :{" "}
            {validation.chauffage_type
              ? chauffageLabel(validation.chauffage_type)
              : "Non renseigné"}
          </p>
          <p className="text-muted-foreground">
            VMC : {validation.vmc_type ? vmcLabel(validation.vmc_type) : "Non renseigné"}
          </p>
        </div>
      ) : null}

      <h1 className="text-lg font-semibold tracking-tight text-foreground">Interventions</h1>
      {interventions.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {interventions.map((intervention) => (
            <li
              key={intervention.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
            >
              <span className="text-muted-foreground">
                {dateFormatter.format(new Date(intervention.date_intervention))}
              </span>
              <span className="flex-1 font-medium text-foreground">
                {intervention.type_travaux}
              </span>
              <span className="text-muted-foreground">
                Artisan (SIRET {intervention.artisan_siret ?? "inconnu"})
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  intervention.rge_verifie
                    ? "bg-secondary text-secondary-foreground"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {intervention.rge_verifie ? "RGE vérifié" : "RGE non vérifié"}
                {intervention.rge_verifie_a
                  ? ` le ${dateTimeFormatter.format(new Date(intervention.rge_verifie_a))}`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Aucune intervention à afficher.</p>
      )}
    </main>
  );
}
