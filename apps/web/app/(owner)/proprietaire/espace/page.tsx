import { chauffageLabel, vmcLabel } from "@/lib/equipements";
import { consommationFormatter, dateFormatter, surfaceFormatter } from "@/lib/formatters";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import { AdresseForm } from "./AdresseForm";
import { CreerFicheForm } from "./CreerFicheForm";
import { DetailsLogementForm } from "./DetailsLogementForm";
import { EntretienForm } from "./EntretienForm";
import { EquipementsForm } from "./EquipementsForm";
import { InterventionsHistorique } from "./InterventionsHistorique";
import { LogementMapClient } from "./LogementMapClient";

export default async function EspaceProprietairePage() {
  const supabase = await getServerSupabaseClient();

  const { data: logement } = await supabase
    .from("logements")
    .select(
      "id, adresse, chauffage_type, vmc_type, dpe_classe_energie, dpe_classe_ges, dpe_consommation, dpe_emissions, dpe_date_diagnostic, surface_habitable, nombre_pieces, annee_construction, type_operation, derniere_verif_chauffage_gaz, derniere_verif_chauffage_bois, derniere_verif_vmc, attestation_entretien_vmc_uploaded_at, attestation_entretien_chauffage_gaz_uploaded_at, attestation_entretien_chauffage_bois_uploaded_at",
    )
    .maybeSingle();

  const { data: interventions } = logement
    ? await supabase
        .from("interventions")
        .select(
          "id, type_travaux, date_intervention, montant_euros, duree_heures, artisan_id, artisan_siret, rge_verifie, rge_verifie_a, attestation_decennale_path, attestation_decennale_uploaded_at",
        )
        .eq("logement_id", logement.id)
        .order("date_intervention", { ascending: false })
    : { data: null };

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Mon logement</h1>
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
              Surface :{" "}
              {logement.surface_habitable
                ? `${surfaceFormatter.format(logement.surface_habitable)} m²`
                : "Non disponible"}
              {" · "}
              Pièces : {logement.nombre_pieces ?? "Non renseigné"}
              {" · "}
              Construit en : {logement.annee_construction ?? "Non renseigné"}
            </p>
          </div>
          <LogementMapClient adresse={logement.adresse} />
          <AdresseForm logementId={logement.id} adresse={logement.adresse} />
          <DetailsLogementForm
            logementId={logement.id}
            nombrePieces={logement.nombre_pieces}
            anneeConstruction={logement.annee_construction}
            typeOperation={logement.type_operation}
          />
          <EquipementsForm
            logementId={logement.id}
            chauffageType={logement.chauffage_type}
            vmcType={logement.vmc_type}
          />
          <EntretienForm
            logementId={logement.id}
            chauffageType={logement.chauffage_type}
            vmcType={logement.vmc_type}
            derniereVerifChauffageGaz={logement.derniere_verif_chauffage_gaz}
            derniereVerifChauffageBois={logement.derniere_verif_chauffage_bois}
            derniereVerifVmc={logement.derniere_verif_vmc}
            attestationChauffageGazUploadedAt={logement.attestation_entretien_chauffage_gaz_uploaded_at}
            attestationChauffageBoisUploadedAt={logement.attestation_entretien_chauffage_bois_uploaded_at}
            attestationVmcUploadedAt={logement.attestation_entretien_vmc_uploaded_at}
          />

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
          <InterventionsHistorique interventions={interventions ?? []} />
        </>
      ) : (
        <CreerFicheForm />
      )}
    </>
  );
}
