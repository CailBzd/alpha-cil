import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function isNonEmptyString(value: FormDataEntryValue | null): value is string {
  return typeof value === "string" && value.length > 0;
}

export async function POST(request: Request) {
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
