import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface AdresseRechercheBody {
  adresse?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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
