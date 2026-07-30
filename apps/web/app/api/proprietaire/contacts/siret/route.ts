import { createServerSupabaseClient } from "@alpha-cil/db";
import { verifySiret } from "@alpha-cil/intervention";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface SiretLookupBody {
  siret?: unknown;
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
