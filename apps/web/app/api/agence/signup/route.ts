import { isNonEmptyString } from "@/lib/form-validation";
import { createSiretAccount } from "@/lib/siret-signup";
import { NextResponse } from "next/server";

interface SignupBody {
  email?: unknown;
  password?: unknown;
  siret?: unknown;
  token?: unknown;
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

  return createSiretAccount({
    email,
    password,
    siret,
    table: "agences",
    afterInsert: async (supabase) => {
      const { data: claimReason } = await supabase.rpc("claim_agence_grant", { p_token: token });
      return { claimed: claimReason === "success" };
    },
  });
}
