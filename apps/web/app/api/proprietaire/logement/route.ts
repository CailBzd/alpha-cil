import { createServerSupabaseClient } from "@alpha-cil/db";
import { lookupDpe } from "@alpha-cil/logement";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { adresse?: unknown } | null;

  if (!body || !isNonEmptyString(body.adresse)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

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

  const { data: existingLogement } = await supabase.from("logements").select("id").maybeSingle();

  if (existingLogement) {
    return NextResponse.json({ error: "already_has_logement" }, { status: 400 });
  }

  const dpe = await lookupDpe(body.adresse);

  const { data: result } = await supabase.rpc("create_logement_from_adresse", {
    p_adresse: body.adresse,
    p_dpe_classe_energie: dpe?.classeEnergie ?? null,
    p_dpe_classe_ges: dpe?.classeGes ?? null,
  });

  const outcome = result?.[0];

  if (!outcome?.success) {
    return NextResponse.json({ error: "adresse_unavailable" }, { status: 409 });
  }

  return NextResponse.json({ logementId: outcome.logement_id });
}
