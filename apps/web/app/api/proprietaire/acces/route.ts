import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface AccesBody {
  tiersEmail?: unknown;
  scope?: unknown;
  expiresAt?: unknown;
  interventionIds?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AccesBody | null;

  if (
    !body ||
    !isNonEmptyString(body.tiersEmail) ||
    (body.scope !== "total" && body.scope !== "partiel") ||
    !isNonEmptyString(body.expiresAt)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const interventionIds = Array.isArray(body.interventionIds)
    ? body.interventionIds.filter((id): id is string => typeof id === "string")
    : [];

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

  const { data: grant, error: grantError } = await supabase
    .from("logement_access_grants")
    .insert({
      logement_id: logement.id,
      tiers_email: body.tiersEmail,
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

  return NextResponse.json({ token: grant.token });
}
