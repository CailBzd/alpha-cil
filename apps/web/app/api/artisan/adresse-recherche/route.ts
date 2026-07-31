import { isNonEmptyStringTrimmed as isNonEmptyString } from "@/lib/form-validation";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface AdresseRechercheBody {
  adresse?: unknown;
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

  const body = (await request.json().catch(() => null)) as AdresseRechercheBody | null;

  if (!body || !isNonEmptyString(body.adresse)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { data: exists, error } = await supabase.rpc("logement_exists_for_adresse", {
    p_adresse: body.adresse,
  });

  if (error) {
    return NextResponse.json({ error: "recherche_indisponible" }, { status: 400 });
  }

  return NextResponse.json({ exists: exists === true });
}
