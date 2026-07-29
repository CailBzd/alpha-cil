import { createServerSupabaseClient } from "@alpha-cil/db";
import { verifySiret } from "@alpha-cil/intervention";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface SignupBody {
  email?: unknown;
  password?: unknown;
  siret?: unknown;
  token?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SignupBody | null;

  // Unlike artisan signup, the token is required: an agency account can
  // only ever be created from an owner's invitation, never self-serve.
  if (
    !body ||
    !isNonEmptyString(body.email) ||
    !isNonEmptyString(body.password) ||
    !isNonEmptyString(body.siret) ||
    !isNonEmptyString(body.token)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { email, password, siret, token } = body;

  // Verified before signUp so a bad SIRET never leaves behind an orphaned
  // auth.users row with no matching agences profile.
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
    .from("agences")
    .insert({ id: userId, siret, denomination: siretResult.denomination });

  if (insertError) {
    return NextResponse.json({ error: "signup_failed" }, { status: 400 });
  }

  const { data: claimReason } = await supabase.rpc("claim_agence_grant", { p_token: token });

  return NextResponse.json({ success: true, claimed: claimReason === "success" });
}
