import type { createServerSupabaseClient } from "@foya/db";

type SupabaseClient = ReturnType<typeof createServerSupabaseClient>;

export type Persona = "artisan" | "agence" | "proprietaire";

export const PERSONA_ESPACE_PATH: Record<Persona, string> = {
  artisan: "/artisan/espace",
  agence: "/agence/espace",
  proprietaire: "/proprietaire/espace",
};

// Auth is a single shared Supabase user pool across all three personas —
// nothing in the login flow itself distinguishes an artisan account from an
// owner or agency one. artisans/agences rows are the only signal; a user
// with neither is a propriétaire by default (that persona has no identity
// table of its own, only proprietaire_id ownership on logements).
export async function resolvePersona(supabase: SupabaseClient, userId: string): Promise<Persona> {
  const [{ data: artisan }, { data: agence }] = await Promise.all([
    supabase.from("artisans").select("id").eq("id", userId).maybeSingle(),
    supabase.from("agences").select("id").eq("id", userId).maybeSingle(),
  ]);

  if (artisan) {
    return "artisan";
  }
  if (agence) {
    return "agence";
  }
  return "proprietaire";
}
