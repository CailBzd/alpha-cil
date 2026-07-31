import { sendMail } from "@alpha-cil/notifications";
import { isNonEmptyString } from "@/lib/form-validation";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface AccesBody {
  tiersEmail?: unknown;
  tiersType?: unknown;
  scope?: unknown;
  expiresAt?: unknown;
  interventionIds?: unknown;
  confirmed?: unknown;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AccesBody | null;

  if (
    !body ||
    !isNonEmptyString(body.tiersEmail) ||
    (body.scope !== "total" && body.scope !== "partiel") ||
    (body.tiersType !== "agence" && body.tiersType !== "autre") ||
    !isNonEmptyString(body.expiresAt)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const interventionIds = Array.isArray(body.interventionIds)
    ? body.interventionIds.filter((id): id is string => typeof id === "string")
    : [];

  if (body.scope === "partiel" && interventionIds.length === 0 && body.confirmed !== true) {
    return NextResponse.json({ error: "empty_selection" }, { status: 400 });
  }

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

  const { data: grant, error: grantError } = await supabase
    .from("logement_access_grants")
    .insert({
      logement_id: logement.id,
      tiers_email: body.tiersEmail,
      tiers_type: body.tiersType,
      scope: body.scope,
      expires_at: new Date(body.expiresAt).toISOString(),
    })
    .select("id, token")
    .single();

  if (grantError || !grant) {
    return NextResponse.json({ error: "creation_failed" }, { status: 400 });
  }

  if (body.scope === "partiel" && interventionIds.length > 0) {
    const rows = interventionIds.map((interventionId) => ({
      grant_id: grant.id,
      intervention_id: interventionId,
    }));
    const { error: linkError } = await supabase
      .from("logement_access_grant_interventions")
      .insert(rows);

    if (linkError) {
      await supabase.from("logement_access_grants").delete().eq("id", grant.id);
      return NextResponse.json({ error: "creation_failed" }, { status: 400 });
    }
  }

  if (body.tiersType === "agence") {
    const origin = new URL(request.url).origin;
    const html = `<p>Un propriétaire vous invite à consulter le carnet d'un logement en lecture seule.</p>
         <p><a href="${origin}/agence/inscription?token=${grant.token}">Créez votre compte agence</a> pour y accéder (vérification SIRET requise).</p>`;

    // A notification failure never invalidates the grant already created —
    // the owner still sees the raw link in AccesForm as a fallback, same
    // resilience posture as the other sendMail call sites in this codebase.
    await sendMail(body.tiersEmail, "Alpha CIL — invitation à consulter un logement", html).catch(
      () => {},
    );
  }

  return NextResponse.json({ token: grant.token });
}
