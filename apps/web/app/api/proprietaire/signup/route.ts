import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface SignupBody {
  email?: unknown;
  password?: unknown;
  token?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SignupBody | null;

  if (!body || !isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { email, password } = body;
  const token = isNonEmptyString(body.token) ? body.token : null;

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

  if (!data.user) {
    return NextResponse.json({ error: "signup_failed" }, { status: 400 });
  }

  if (token) {
    // A claim failure here (rare race after the page's own preview check,
    // e.g. the token expired between page load and submission) never
    // invalidates the account that was just created.
    await supabase.rpc("claim_logement_invitation", { invitation_token: token });
  }

  return NextResponse.json({ success: true });
}
