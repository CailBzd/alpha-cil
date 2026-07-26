import { createServerSupabaseClient } from "@alpha-cil/db";
import { verifyRge } from "@alpha-cil/intervention";
import { sendMail } from "@alpha-cil/notifications";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface MatchOrCreateLogementResult {
  logement_id: string | null;
  created: boolean;
  ambiguous: boolean;
  invitation_token: string | null;
  notify_email: string | null;
}

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
  const adresseLogement = formData.get("adresseLogement");
  const emailClient = formData.get("emailClient");
  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (
    !(facture instanceof File) ||
    facture.size === 0 ||
    !isNonEmptyString(typeTravaux) ||
    !isNonEmptyString(dateIntervention) ||
    !isNonEmptyString(montantEuros) ||
    !isNonEmptyString(corpsMetier) ||
    !isNonEmptyString(adresseLogement) ||
    !isNonEmptyString(emailClient)
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

  const { data: matchResult } = await supabase.rpc("match_or_create_logement", {
    p_adresse: adresseLogement,
    p_contact_email: emailClient,
  });
  const match = (matchResult?.[0] ?? null) as MatchOrCreateLogementResult | null;

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
    adresse_logement: adresseLogement,
    email_client: emailClient,
    logement_id: match?.ambiguous ? null : (match?.logement_id ?? null),
    rattachement_ambigu: match?.ambiguous ?? false,
  });

  if (insertError) {
    await supabase.storage.from("interventions").remove([facturePath, ...photoPaths]);
    return NextResponse.json({ error: "submission_failed" }, { status: 400 });
  }

  if (match?.notify_email) {
    const origin = new URL(request.url).origin;
    const html = match.invitation_token
      ? `<p>Une intervention a été enregistrée pour le logement situé au ${adresseLogement}.</p>
         <p><a href="${origin}/proprietaire/inscription?token=${match.invitation_token}">Créez votre compte pour consulter votre carnet</a>.</p>`
      : `<p>Une nouvelle intervention a été ajoutée au carnet de votre logement situé au ${adresseLogement}.</p>
         <p><a href="${origin}/proprietaire/connexion">Connectez-vous pour la consulter</a>.</p>`;

    // A notification failure never invalidates the intervention already
    // recorded, same resilience posture as the RGE verification above.
    await sendMail(match.notify_email, "Alpha CIL — nouvelle intervention sur votre logement", html).catch(
      () => {},
    );
  }

  return NextResponse.json({ success: true });
}
