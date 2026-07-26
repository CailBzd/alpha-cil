import { createServerSupabaseClient } from "@alpha-cil/db";
import { verifyRge } from "@alpha-cil/intervention";
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

  const formData = await request.formData();
  const facture = formData.get("facture");
  const typeTravaux = formData.get("typeTravaux");
  const dateIntervention = formData.get("dateIntervention");
  const montantEuros = formData.get("montantEuros");
  const corpsMetier = formData.get("corpsMetier");
  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (
    !(facture instanceof File) ||
    facture.size === 0 ||
    !isNonEmptyString(typeTravaux) ||
    !isNonEmptyString(dateIntervention) ||
    !isNonEmptyString(montantEuros) ||
    !isNonEmptyString(corpsMetier)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (facture.type !== "application/pdf") {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }

  const facturePath = `${user.id}/facture-${crypto.randomUUID()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("interventions")
    .upload(facturePath, facture, { contentType: "application/pdf" });

  if (uploadError) {
    return NextResponse.json({ error: "submission_failed" }, { status: 400 });
  }

  const photoPaths: string[] = [];
  for (const photo of photos) {
    const extension = photo.type === "image/png" ? "png" : "jpg";
    const photoPath = `${user.id}/photo-${crypto.randomUUID()}.${extension}`;
    const { error: photoError } = await supabase.storage
      .from("interventions")
      .upload(photoPath, photo, { contentType: photo.type });
    if (!photoError) {
      photoPaths.push(photoPath);
    }
  }

  const { data: artisan } = await supabase
    .from("artisans")
    .select("siret")
    .eq("id", user.id)
    .single();

  const rgeVerifie = artisan ? await verifyRge(artisan.siret, dateIntervention) : false;

  const { error: insertError } = await supabase.from("interventions").insert({
    artisan_id: user.id,
    type_travaux: typeTravaux,
    date_intervention: dateIntervention,
    montant_euros: Number(montantEuros),
    corps_metier: corpsMetier,
    facture_path: facturePath,
    photos: photoPaths,
    rge_verifie: rgeVerifie,
    rge_verifie_a: new Date().toISOString(),
  });

  if (insertError) {
    await supabase.storage.from("interventions").remove([facturePath, ...photoPaths]);
    return NextResponse.json({ error: "submission_failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
