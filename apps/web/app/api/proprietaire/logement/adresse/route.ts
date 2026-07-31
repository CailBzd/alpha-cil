import { lookupDpe } from "@alpha-cil/logement";
import { isNonEmptyString } from "@/lib/form-validation";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { logementId?: unknown; adresse?: unknown }
    | null;

  if (!body || !isNonEmptyString(body.logementId) || !isNonEmptyString(body.adresse)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const dpe = await lookupDpe(body.adresse);

  const { data: result } = await supabase.rpc("update_logement_adresse", {
    p_logement_id: body.logementId,
    p_adresse: body.adresse,
    p_dpe_classe_energie: dpe?.classeEnergie ?? null,
    p_dpe_classe_ges: dpe?.classeGes ?? null,
    p_dpe_consommation: dpe?.consommation ?? null,
    p_dpe_emissions: dpe?.emissions ?? null,
    p_dpe_date_diagnostic: dpe?.dateDiagnostic ?? null,
    p_surface_habitable: dpe?.surfaceHabitable ?? null,
  });

  if (!result?.[0]?.success) {
    return NextResponse.json({ error: "adresse_unavailable" }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
