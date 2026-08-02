import { isNonEmptyString } from "@/lib/form-validation";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: logement } = await supabase.from("logements").select("id").maybeSingle();

  if (!logement) {
    return NextResponse.json({ error: "no_logement" }, { status: 400 });
  }

  const formData = await request.formData();
  const typeTravaux = formData.get("typeTravaux");
  const dateIntervention = formData.get("dateIntervention");
  const montantEuros = formData.get("montantEuros");
  const corpsMetier = formData.get("corpsMetier");
  const dureeHeures = formData.get("dureeHeures");
  const facture = formData.get("facture");
  const hasFacture = facture instanceof File && facture.size > 0;

  if (
    !isNonEmptyString(typeTravaux) ||
    !isNonEmptyString(dateIntervention) ||
    !isNonEmptyString(montantEuros) ||
    !isNonEmptyString(corpsMetier)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (hasFacture && facture.type !== "application/pdf") {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }

  let facturePath: string | null = null;
  if (hasFacture) {
    facturePath = `${user.id}/facture-${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("interventions")
      .upload(facturePath, facture, { contentType: "application/pdf" });

    if (uploadError) {
      return NextResponse.json({ error: "submission_failed" }, { status: 400 });
    }
  }

  const { error: insertError } = await supabase.from("interventions").insert({
    artisan_id: null,
    logement_id: logement.id,
    type_travaux: typeTravaux,
    date_intervention: dateIntervention,
    montant_euros: Number(montantEuros),
    corps_metier: corpsMetier,
    duree_heures: isNonEmptyString(dureeHeures) ? Number(dureeHeures) : null,
    facture_path: facturePath,
    rge_verifie: false,
    rge_verifie_a: null,
    artisan_siret: null,
  });

  if (insertError) {
    if (facturePath) {
      await supabase.storage.from("interventions").remove([facturePath]);
    }
    return NextResponse.json({ error: "submission_failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
