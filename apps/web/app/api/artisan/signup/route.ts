import { isNonEmptyString, isNonEmptyStringArray } from "@/lib/form-validation";
import { createSiretAccount } from "@/lib/siret-signup";
import { NextResponse } from "next/server";

interface SignupBody {
  email?: unknown;
  password?: unknown;
  siret?: unknown;
  corpsMetier?: unknown;
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

  return createSiretAccount({
    email,
    password,
    siret,
    table: "artisans",
    extraFields: { corps_metier: corpsMetier },
  });
}
