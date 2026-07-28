import { createServerSupabaseClient } from "@alpha-cil/db";
import { CHAUFFAGE_OPTIONS, VMC_OPTIONS } from "@/lib/equipements";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "../../../AppHeader";
import { ThemeToggle } from "../../../theme-toggle";
import { AttestationLink } from "./AttestationLink";
import { CreerFicheForm } from "./CreerFicheForm";
import { DetailsLogementForm } from "./DetailsLogementForm";
import { EntretienForm } from "./EntretienForm";
import { EquipementsForm } from "./EquipementsForm";
import { LogementMapClient } from "./LogementMapClient";
import { SignOutButton } from "./SignOutButton";

function chauffageLabel(value: string) {
  return CHAUFFAGE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function vmcLabel(value: string) {
  return VMC_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });
const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });
const montantFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const consommationFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const surfaceFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

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
    .select(
      "id, adresse, chauffage_type, vmc_type, dpe_classe_energie, dpe_classe_ges, dpe_consommation, dpe_emissions, dpe_date_diagnostic, surface_habitable, nombre_pieces, annee_construction, derniere_verif_chauffage_gaz, derniere_verif_chauffage_bois, derniere_verif_vmc",
    )
    .maybeSingle();

  const incomplet = logement
    ? !logement.chauffage_type || logement.chauffage_type.length === 0 || !logement.vmc_type
    : false;

  const { data: interventions } = logement
    ? await supabase
        .from("interventions")
        .select(
          "id, type_travaux, date_intervention, montant_euros, artisan_id, artisan_siret, rge_verifie, rge_verifie_a, attestation_decennale_path, attestation_decennale_uploaded_at",
        )
        .eq("logement_id", logement.id)
        .order("date_intervention", { ascending: false })
    : { data: null };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader>
        <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
        <ThemeToggle />
        <SignOutButton />
      </AppHeader>
      <main className="mx-auto max-w-3xl space-y-4 px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Mon logement</h1>
          <div className="flex gap-4">
            <Link
              href="/proprietaire/espace/finances"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              Suivi financier
            </Link>
            <Link
              href="/proprietaire/espace/contacts"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              Carnet de contacts
            </Link>
            <Link
              href="/proprietaire/espace/rappels"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              Mes rappels
            </Link>
            <Link
              href="/proprietaire/espace/projets"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              Mes projets
            </Link>
            <Link
              href="/proprietaire/espace/acces"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              Gérer les accès
            </Link>
            <Link
              href="/proprietaire/espace/export"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              Exporter
            </Link>
          </div>
        </div>
        {logement ? (
          <>
            <div className="space-y-1 text-sm">
              <p className="text-foreground">{logement.adresse}</p>
              <p className="text-muted-foreground">
                Chauffage :{" "}
                {logement.chauffage_type && logement.chauffage_type.length > 0
                  ? logement.chauffage_type.map(chauffageLabel).join(", ")
                  : "Non renseigné"}
              </p>
              <p className="text-muted-foreground">
                VMC : {logement.vmc_type ? vmcLabel(logement.vmc_type) : "Non renseigné"}
              </p>
              <p className="text-muted-foreground">
                DPE : {logement.dpe_classe_energie ?? "Non disponible"}
                {logement.dpe_classe_ges ? ` · GES : ${logement.dpe_classe_ges}` : ""}
                {logement.dpe_consommation
                  ? ` · ${consommationFormatter.format(logement.dpe_consommation)} kWh/m²/an`
                  : ""}
                {logement.dpe_emissions
                  ? ` · ${consommationFormatter.format(logement.dpe_emissions)} kgCO2/m²/an`
                  : ""}
                {logement.dpe_date_diagnostic
                  ? ` · diagnostiqué le ${dateFormatter.format(new Date(logement.dpe_date_diagnostic))}`
                  : ""}
              </p>
              <p className="text-muted-foreground">
                Surface : {logement.surface_habitable ? `${surfaceFormatter.format(logement.surface_habitable)} m²` : "Non disponible"}
                {" · "}
                Pièces : {logement.nombre_pieces ?? "Non renseigné"}
                {" · "}
                Construit en : {logement.annee_construction ?? "Non renseigné"}
              </p>
            </div>
            <LogementMapClient adresse={logement.adresse} />
            <DetailsLogementForm
              logementId={logement.id}
              nombrePieces={logement.nombre_pieces}
              anneeConstruction={logement.annee_construction}
            />
            {incomplet ? (
              <EquipementsForm
                logementId={logement.id}
                chauffageType={logement.chauffage_type}
                vmcType={logement.vmc_type}
              />
            ) : (
              <EntretienForm
                logementId={logement.id}
                chauffageType={logement.chauffage_type}
                vmcType={logement.vmc_type}
                derniereVerifChauffageGaz={logement.derniere_verif_chauffage_gaz}
                derniereVerifChauffageBois={logement.derniere_verif_chauffage_bois}
                derniereVerifVmc={logement.derniere_verif_vmc}
              />
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Historique des interventions
              </h2>
              <Link
                href="/proprietaire/espace/interventions/nouvelle"
                className="text-sm font-medium text-foreground underline underline-offset-4"
              >
                Ajouter une intervention
              </Link>
            </div>
            {interventions && interventions.length > 0 ? (
              <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                {interventions.map((intervention) =>
                  intervention.artisan_id === null ? (
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
                      <span className="text-foreground">
                        {montantFormatter.format(Number(intervention.montant_euros))}
                      </span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        Saisie par vous
                      </span>
                    </li>
                  ) : (
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
                      <span className="text-foreground">
                        {montantFormatter.format(Number(intervention.montant_euros))}
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
                        {intervention.attestation_decennale_path ? (
                          <>
                            {" "}
                            <AttestationLink path={intervention.attestation_decennale_path} />
                            {intervention.attestation_decennale_uploaded_at
                              ? ` (enregistrée le ${dateFormatter.format(new Date(intervention.attestation_decennale_uploaded_at))})`
                              : ""}
                          </>
                        ) : (
                          " Aucune attestation fournie."
                        )}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune intervention enregistrée pour ce logement pour l&apos;instant.
              </p>
            )}
          </>
        ) : (
          <CreerFicheForm />
        )}
      </main>
    </div>
  );
}
