import { buttonVariants } from "@alpha-cil/ui";
import { corpsMetierLabel } from "@/lib/corps-metier";
import {
  consommationFormatter,
  dateFormatter,
  dateTimeFormatter,
  montantFormatter,
} from "@/lib/formatters";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";

const STATUT_LABELS: Record<string, string> = {
  en_attente_verification: "En attente de vérification",
};

export default async function EspaceArtisanPage() {
  const supabase = await getServerSupabaseClient();

  const { data: interventions } = await supabase
    .from("interventions")
    .select(
      "id, type_travaux, date_intervention, montant_euros, corps_metier, statut, rge_verifie, rge_verifie_a, dpe_classe_energie, dpe_classe_ges, dpe_consommation, dpe_emissions, dpe_date_diagnostic",
    )
    .order("date_intervention", { ascending: false });

  const { data: artisan } = await supabase
    .from("artisans")
    .select("attestation_decennale_uploaded_at")
    .single();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Mes interventions</h1>
        <Link href="/artisan/espace/interventions/nouvelle" className={buttonVariants()}>
          Soumettre une intervention
        </Link>
      </div>
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
              <span className="flex-1 font-medium text-foreground">{intervention.type_travaux}</span>
              <span className="text-muted-foreground">{corpsMetierLabel(intervention.corps_metier)}</span>
              <span className="text-foreground">
                {montantFormatter.format(Number(intervention.montant_euros))}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {STATUT_LABELS[intervention.statut] ?? intervention.statut}
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
              <span className="w-full text-xs text-muted-foreground">
                DPE :{" "}
                {intervention.dpe_classe_energie
                  ? `${intervention.dpe_classe_energie}${
                      intervention.dpe_classe_ges ? ` · GES : ${intervention.dpe_classe_ges}` : ""
                    }${
                      intervention.dpe_consommation
                        ? ` · ${consommationFormatter.format(intervention.dpe_consommation)} kWh/m²/an`
                        : ""
                    }${
                      intervention.dpe_emissions
                        ? ` · ${consommationFormatter.format(intervention.dpe_emissions)} kgCO2/m²/an`
                        : ""
                    }${
                      intervention.dpe_date_diagnostic
                        ? ` · diagnostiqué le ${dateFormatter.format(new Date(intervention.dpe_date_diagnostic))}`
                        : ""
                    }`
                  : "Non disponible"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Vous n&apos;avez pas encore soumis d&apos;intervention. Utilisez le bouton ci-dessus pour
          ajouter la première.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Attestation décennale : déclarative, non vérifiée par une source tierce.{" "}
        {artisan?.attestation_decennale_uploaded_at ? (
          `Enregistrée le ${new Date(artisan.attestation_decennale_uploaded_at).toLocaleDateString("fr-FR")}.`
        ) : (
          <Link href="/artisan/espace/profil" className="underline underline-offset-4">
            Renseignez-la sur votre profil.
          </Link>
        )}
      </p>
    </>
  );
}
