import { verifySiret } from "@foya/intervention";
import { isNonEmptyStringTrimmed as isNonEmptyString } from "@/lib/form-validation";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface SiretLookupBody {
  siret?: unknown;
}

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SiretLookupBody | null;

  if (!body || !isNonEmptyString(body.siret)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const result = await verifySiret(body.siret);

  if (result.status !== "valide") {
    return NextResponse.json(
      { error: result.status === "introuvable" ? "siret_invalide" : "siret_indisponible" },
      { status: 422 },
    );
  }

  return NextResponse.json({ denomination: result.denomination });
}
