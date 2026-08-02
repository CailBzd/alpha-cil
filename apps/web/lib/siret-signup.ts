import { verifySiret } from "@foya/intervention";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase-server";

interface CreateSiretAccountParams {
  email: string;
  password: string;
  siret: string;
  table: "artisans" | "agences";
  extraFields?: Record<string, unknown>;
  /** Runs once the account row is inserted, on the same authenticated
   * client (e.g. agence's post-signup grant claim). Extra keys returned
   * here are merged into the success response body. */
  afterInsert?: (supabase: SupabaseClient, userId: string) => Promise<Record<string, unknown> | void>;
}

// Shared by the artisan and agence signup routes (~90% identical: SIRET
// verification before signUp — so a bad SIRET never leaves behind an
// orphaned auth.users row — then signUp, then the profile row insert).
export async function createSiretAccount({
  email,
  password,
  siret,
  table,
  extraFields,
  afterInsert,
}: CreateSiretAccountParams) {
  const siretResult = await verifySiret(siret);
  if (siretResult.status !== "valide") {
    return NextResponse.json(
      { error: siretResult.status === "introuvable" ? "siret_invalide" : "siret_indisponible" },
      { status: 422 },
    );
  }

  const supabase = await getServerSupabaseClient();
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
    .from(table)
    .insert({ id: userId, siret, denomination: siretResult.denomination, ...extraFields });

  if (insertError) {
    return NextResponse.json({ error: "signup_failed" }, { status: 400 });
  }

  const extra = afterInsert ? await afterInsert(supabase, userId) : undefined;
  return NextResponse.json({ success: true, ...extra });
}
