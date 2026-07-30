import { createServerSupabaseClient } from "@alpha-cil/db";
import { verifySiret } from "@alpha-cil/intervention";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface SignupBody {
  email?: unknown;
  password?: unknown;
  siret?: unknown;
  corpsMetier?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SignupBody | null;

  if (
    !body ||
    !isNonEmptyString(body.email) ||
    !isNonEmptyString(body.password) ||
    !isNonEmptyString(body.siret) ||
    !isNonEmptyStringArray(body.corpsMetier)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { email, password, siret, corpsMetier } = body;

  // Verified before signUp so a bad SIRET never leaves behind an orphaned
  // auth.users row with no matching artisans profile.
  const siretResult = await verifySiret(siret);
  if (siretResult.status !== "valide") {
    return NextResponse.json(
      { error: siretResult.status === "introuvable" ? "siret_invalide" : "siret_indisponible" },
      { status: 422 },
    );
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

  const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

  if (signUpError) {
    if (
      signUpError.code === "user_already_exists" ||
      signUpError.message.toLowerCase().includes("already registered")
    ) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "signup_failed" }, { status: 400 });
  }

  const userId = data.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "signup_failed" }, { status: 400 });
  }

  const { error: insertError } = await supabase
    .from("artisans")
    .insert({ id: userId, siret, corps_metier: corpsMetier, denomination: siretResult.denomination });

  if (insertError) {
    return NextResponse.json({ error: "signup_failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
