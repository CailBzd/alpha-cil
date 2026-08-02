import { verifyRge } from "@foya/intervention";
import { lookupDpe } from "@foya/logement";
import { sendMail } from "@foya/notifications";
import { isNonEmptyString } from "@/lib/form-validation";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface MatchOrCreateLogementResult {
  logement_id: string | null;
  created: boolean;
  ambiguous: boolean;
  invitation_token: string | null;
  notify_email: string | null;
}

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: artisan } = await supabase
    .from("artisans")
    .select("siret, attestation_decennale_path, attestation_decennale_uploaded_at")
    .eq("id", user.id)
    .single();

  if (!artisan) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const facture = formData.get("facture");
  const typeTravaux = formData.get("typeTravaux");
  const dateIntervention = formData.get("dateIntervention");
  const montantEuros = formData.get("montantEuros");
  const corpsMetier = formData.get("corpsMetier");
  const dureeHeures = formData.get("dureeHeures");
  const adresseLogement = formData.get("adresseLogement");
  const emailClient = formData.get("emailClient");
  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  // facture/adresseLogement/emailClient are nullable at the DB level since
  // 0015_saisie_intervention_proprietaire.sql (the owner's own entry path
  // needs them optional) — this route is the ONLY remaining place that
  // requires them for an artisan submission. Accepted tradeoff: no other
  // write path exists today, but a future one (a new API route, a Studio
  // edit) would not inherit this enforcement automatically.
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

  // Independent of each other (one depends on the address, the other on
  // the artisan's own SIRET) — run concurrently rather than doubling the
  // worst-case latency of an already slow, external-API-dependent
  // submission path.
  const [dpe, rgeVerifie] = await Promise.all([
    lookupDpe(adresseLogement),
    verifyRge(artisan.siret, dateIntervention),
  ]);

  const { data: matchResult } = await supabase.rpc("match_or_create_logement", {
    p_adresse: adresseLogement,
    p_contact_email: emailClient,
    p_dpe_classe_energie: dpe?.classeEnergie ?? null,
    p_dpe_classe_ges: dpe?.classeGes ?? null,
    p_dpe_consommation: dpe?.consommation ?? null,
    p_dpe_emissions: dpe?.emissions ?? null,
    p_dpe_date_diagnostic: dpe?.dateDiagnostic ?? null,
    p_surface_habitable: dpe?.surfaceHabitable ?? null,
  });
  const match = (matchResult?.[0] ?? null) as MatchOrCreateLogementResult | null;

  if (match?.ambiguous) {
    return NextResponse.json({ error: "adresse_ambigue" }, { status: 409 });
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

  const { error: insertError } = await supabase.from("interventions").insert({
    artisan_id: user.id,
    type_travaux: typeTravaux,
    date_intervention: dateIntervention,
    montant_euros: Number(montantEuros),
    corps_metier: corpsMetier,
    duree_heures: isNonEmptyString(dureeHeures) ? Number(dureeHeures) : null,
    facture_path: facturePath,
    photos: photoPaths,
    rge_verifie: rgeVerifie,
    rge_verifie_a: new Date().toISOString(),
    adresse_logement: adresseLogement,
    email_client: emailClient,
    logement_id: match?.logement_id ?? null,
    artisan_siret: artisan.siret,
    attestation_decennale_path: artisan.attestation_decennale_path,
    attestation_decennale_uploaded_at: artisan.attestation_decennale_uploaded_at,
    dpe_classe_energie: dpe?.classeEnergie ?? null,
    dpe_classe_ges: dpe?.classeGes ?? null,
    dpe_consommation: dpe?.consommation ?? null,
    dpe_emissions: dpe?.emissions ?? null,
    dpe_date_diagnostic: dpe?.dateDiagnostic ?? null,
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
    await sendMail(match.notify_email, "Foya — nouvelle intervention sur votre logement", html).catch(
      () => {},
    );
  }

  return NextResponse.json({ success: true });
}
