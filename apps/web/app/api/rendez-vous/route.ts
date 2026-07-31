import { sendMail } from "@alpha-cil/notifications";
import { isNonEmptyString } from "@/lib/form-validation";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        typeTravaux?: unknown;
        datePrevue?: unknown;
        contactId?: unknown;
        artisanEmail?: unknown;
        notes?: unknown;
      }
    | null;

  if (!body || !isNonEmptyString(body.typeTravaux) || !isNonEmptyString(body.datePrevue)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: logement } = await supabase.from("logements").select("id, adresse").maybeSingle();

  if (!logement) {
    return NextResponse.json({ error: "no_logement" }, { status: 400 });
  }

  const artisanEmail = isNonEmptyString(body.artisanEmail) ? body.artisanEmail : null;

  const { data: rendezVous, error: insertError } = await supabase
    .from("rendez_vous")
    .insert({
      logement_id: logement.id,
      adresse_logement: logement.adresse,
      type_travaux: body.typeTravaux,
      date_prevue: body.datePrevue,
      contact_id: isNonEmptyString(body.contactId) ? body.contactId : null,
      notes: isNonEmptyString(body.notes) ? body.notes : null,
    })
    .select("id")
    .single();

  if (insertError || !rendezVous) {
    return NextResponse.json({ error: "creation_failed" }, { status: 400 });
  }

  if (!artisanEmail) {
    return NextResponse.json({ success: true, linked: null });
  }

  const { data: linkReason } = await supabase.rpc("link_rendez_vous_artisan", {
    p_rendez_vous_id: rendezVous.id,
    p_email: artisanEmail,
  });

  const origin = new URL(request.url).origin;
  const html =
    linkReason === "linked"
      ? `<p>Vous avez été ajouté à un rendez-vous prévu le ${body.datePrevue} pour le logement situé au ${logement.adresse}.</p>
         <p><a href="${origin}/artisan/connexion">Connectez-vous</a> pour le consulter.</p>`
      : `<p>Un propriétaire souhaite vous associer à un rendez-vous prévu le ${body.datePrevue} pour le logement situé au ${logement.adresse}.</p>
         <p><a href="${origin}/artisan/inscription">Créez votre compte artisan</a> pour le suivre.</p>`;

  // A notification failure never invalidates the rendez-vous already
  // created, same resilience posture as every other sendMail call site.
  await sendMail(artisanEmail, "Alpha CIL — rendez-vous sur un logement", html).catch(() => {});

  return NextResponse.json({ success: true, linked: linkReason === "linked" });
}
