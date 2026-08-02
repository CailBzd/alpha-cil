import { lookupDpe } from "@foya/logement";
import { sendMail } from "@foya/notifications";
import { isNonEmptyStringTrimmed as isNonEmptyString } from "@/lib/form-validation";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface MatchOrCreateLogementResult {
  logement_id: string | null;
  created: boolean;
  ambiguous: boolean;
  invitation_token: string | null;
  notify_email: string | null;
}

interface InvitationBody {
  adresse?: unknown;
  email?: unknown;
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
    .select("id")
    .eq("id", user.id)
    .single();

  if (!artisan) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as InvitationBody | null;

  if (!body || !isNonEmptyString(body.adresse) || !isNonEmptyString(body.email)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const dpe = await lookupDpe(body.adresse);

  const { data: matchResult, error } = await supabase.rpc("match_or_create_logement", {
    p_adresse: body.adresse,
    p_contact_email: body.email,
    p_dpe_classe_energie: dpe?.classeEnergie ?? null,
    p_dpe_classe_ges: dpe?.classeGes ?? null,
    p_dpe_consommation: dpe?.consommation ?? null,
    p_dpe_emissions: dpe?.emissions ?? null,
    p_dpe_date_diagnostic: dpe?.dateDiagnostic ?? null,
    p_surface_habitable: dpe?.surfaceHabitable ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "invitation_failed" }, { status: 400 });
  }

  const match = (matchResult?.[0] ?? null) as MatchOrCreateLogementResult | null;

  if (match?.ambiguous) {
    return NextResponse.json({ error: "adresse_ambigue" }, { status: 409 });
  }

  // A logement with no invitation_token here is one that's already claimed
  // by an owner — this action is scoped to "no account exists yet"
  // (per the #11 search it's paired with), not a way to re-notify an
  // owner who already has one.
  if (!match?.invitation_token) {
    return NextResponse.json({ error: "compte_existant" }, { status: 409 });
  }

  const origin = new URL(request.url).origin;
  const html = `<p>Un professionnel vous invite à créer votre compte pour le logement situé au ${body.adresse}.</p>
    <p><a href="${origin}/proprietaire/inscription?token=${match.invitation_token}">Créez votre compte pour consulter votre carnet</a>.</p>`;

  try {
    await sendMail(body.email, "Foya — invitation à créer votre compte", html);
  } catch {
    return NextResponse.json({ error: "invitation_failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
