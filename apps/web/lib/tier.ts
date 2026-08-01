import type { SupabaseClient } from "@supabase/supabase-js";

export type Tier = "gratuit" | "payant";

// Row-existence idiom, mirroring resolvePersona (apps/web/lib/persona.ts):
// a row in abonnements_payants = "payant", absence = "gratuit" default. No
// billing integration exists yet — only service_role ever writes this row
// today (supabase/migrations/0037_abonnements_payants.sql).
export async function resolveTier(supabase: SupabaseClient, userId: string): Promise<Tier> {
  const { data: abonnement } = await supabase
    .from("abonnements_payants")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return abonnement ? "payant" : "gratuit";
}
