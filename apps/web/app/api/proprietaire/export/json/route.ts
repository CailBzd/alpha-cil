import { getServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface ExportJsonBody {
  interventionIds?: unknown;
  includeAdresse?: unknown;
  confirmed?: unknown;
}

// The first machine-readable (open-standard) export this app has ever
// shipped — competitors only offer a PDF, which isn't a genuine open
// standard export per the CIL market study. schemaVersion is explicit
// since there's no CI/schema-registry to catch a silent breaking change
// to this shape later.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ExportJsonBody | null;
  const interventionIds = Array.isArray(body?.interventionIds)
    ? body.interventionIds.filter((id): id is string => typeof id === "string")
    : [];
  const includeAdresse = body?.includeAdresse === true;

  if (interventionIds.length === 0 && !includeAdresse && body?.confirmed !== true) {
    return NextResponse.json({ error: "empty_selection" }, { status: 400 });
  }

  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: logement } = await supabase
    .from("logements")
    .select(
      "id, adresse, type_operation, chauffage_type, vmc_type, dpe_classe_energie, dpe_classe_ges, dpe_consommation, dpe_emissions, dpe_date_diagnostic, surface_habitable, nombre_pieces, annee_construction, derniere_verif_chauffage_gaz, attestation_entretien_chauffage_gaz_uploaded_at, derniere_verif_chauffage_bois, attestation_entretien_chauffage_bois_uploaded_at, derniere_verif_vmc, attestation_entretien_vmc_uploaded_at",
    )
    .maybeSingle();

  if (!logement) {
    return NextResponse.json({ error: "no_logement" }, { status: 400 });
  }

  const { data: interventions } =
    interventionIds.length > 0
      ? await supabase
          .from("interventions")
          .select("id, type_travaux, date_intervention, artisan_siret, rge_verifie, rge_verifie_a")
          .eq("logement_id", logement.id)
          .in("id", interventionIds)
          .order("date_intervention", { ascending: false })
      : { data: [] };

  const payload = {
    schemaVersion: 1,
    genereLe: new Date().toISOString(),
    logement: {
      adresse: includeAdresse ? logement.adresse : null,
      typeOperation: logement.type_operation,
      dpe: {
        classeEnergie: logement.dpe_classe_energie,
        classeGes: logement.dpe_classe_ges,
        consommation: logement.dpe_consommation,
        emissions: logement.dpe_emissions,
        dateDiagnostic: logement.dpe_date_diagnostic,
      },
      surfaceHabitable: logement.surface_habitable,
      nombrePieces: logement.nombre_pieces,
      anneeConstruction: logement.annee_construction,
      chauffageType: logement.chauffage_type,
      vmcType: logement.vmc_type,
      entretien: {
        chauffageGaz: {
          derniereVerification: logement.derniere_verif_chauffage_gaz,
          justificatifEnregistreLe: logement.attestation_entretien_chauffage_gaz_uploaded_at,
        },
        chauffageBois: {
          derniereVerification: logement.derniere_verif_chauffage_bois,
          justificatifEnregistreLe: logement.attestation_entretien_chauffage_bois_uploaded_at,
        },
        vmc: {
          derniereVerification: logement.derniere_verif_vmc,
          justificatifEnregistreLe: logement.attestation_entretien_vmc_uploaded_at,
        },
      },
    },
    interventions: (interventions ?? []).map((intervention) => ({
      typeTravaux: intervention.type_travaux,
      dateIntervention: intervention.date_intervention,
      artisanSiret: intervention.artisan_siret,
      rgeVerifie: intervention.rge_verifie,
      rgeVerifieA: intervention.rge_verifie_a,
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=carnet-alpha-cil.json",
    },
  });
}
