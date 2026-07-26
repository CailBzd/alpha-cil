import { createServerSupabaseClient } from "@alpha-cil/db";
import { CHAUFFAGE_OPTIONS, VMC_OPTIONS } from "@/lib/equipements";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "../../../theme-toggle";
import { EquipementsForm } from "./EquipementsForm";
import { SignOutButton } from "./SignOutButton";

function chauffageLabel(value: string) {
  return CHAUFFAGE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function vmcLabel(value: string) {
  return VMC_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });
const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

export default async function EspaceProprietairePage() {
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

  const { data: logement } = await supabase
    .from("logements")
    .select("id, adresse, chauffage_type, vmc_type")
    .maybeSingle();

  const incomplet = logement ? !logement.chauffage_type || !logement.vmc_type : false;

  const { data: interventions } = logement
    ? await supabase
        .from("interventions")
        .select("id, type_travaux, date_intervention, artisan_siret, rge_verifie, rge_verifie_a")
        .eq("logement_id", logement.id)
        .order("date_intervention", { ascending: false })
    : { data: null };

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
      <main className="mx-auto max-w-3xl space-y-4 px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Mon logement</h1>
          <Link
            href="/proprietaire/espace/acces"
            className="text-sm font-medium text-foreground underline underline-offset-4"
          >
            Gérer les accès
          </Link>
        </div>
        {logement ? (
          <>
            <div className="space-y-1 text-sm">
              <p className="text-foreground">{logement.adresse}</p>
              <p className="text-muted-foreground">
                Chauffage :{" "}
                {logement.chauffage_type ? chauffageLabel(logement.chauffage_type) : "Non renseigné"}
              </p>
              <p className="text-muted-foreground">
                VMC : {logement.vmc_type ? vmcLabel(logement.vmc_type) : "Non renseigné"}
              </p>
            </div>
            {incomplet ? (
              <EquipementsForm
                logementId={logement.id}
                chauffageType={logement.chauffage_type}
                vmcType={logement.vmc_type}
              />
            ) : null}

            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Historique des interventions
            </h2>
            {interventions && interventions.length > 0 ? (
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
                    <span className="text-xs text-muted-foreground">
                      Attestation décennale : déclarative, non vérifiée par une source tierce.
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune intervention enregistrée pour ce logement pour l&apos;instant.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun logement n&apos;est encore lié à votre compte.
          </p>
        )}
      </main>
    </div>
  );
}
