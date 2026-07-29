import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogementReadOnlyView } from "../../../../../LogementReadOnlyView";

export default async function AgenceLogementPage({
  params,
}: {
  params: Promise<{ logementId: string }>;
}) {
  const { logementId } = await params;

  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Server Components can't write cookies. middleware.ts refreshes
        // the session and writes fresh cookies on every request, so a
        // write attempted here is safe to ignore.
      }
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS (migration 0028) already scopes logements/interventions selects to
  // logements the caller has a valid, claimed grant for — a nonexistent or
  // not-granted-to-this-agency id simply comes back null, same defensive
  // posture as the owner's own /projets/[projetId] page.
  const { data: grant } = await supabase
    .from("logement_access_grants")
    .select("scope")
    .eq("logement_id", logementId)
    .eq("agence_id", user?.id ?? "")
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!grant) {
    redirect("/agence/espace");
  }

  const { data: logement } = await supabase
    .from("logements")
    .select("adresse, chauffage_type, vmc_type")
    .eq("id", logementId)
    .maybeSingle();

  const { data: interventions } = await supabase
    .from("interventions")
    .select("id, type_travaux, date_intervention, artisan_siret, rge_verifie, rge_verifie_a")
    .eq("logement_id", logementId)
    .order("date_intervention", { ascending: false });

  return (
    <>
      <Link
        href="/agence/espace"
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        &larr; Retour à mes logements
      </Link>
      <LogementReadOnlyView
        adresse={logement?.adresse ?? null}
        chauffageType={logement?.chauffage_type ?? null}
        vmcType={logement?.vmc_type ?? null}
        showDetails={grant.scope === "total"}
        interventions={interventions ?? []}
      />
    </>
  );
}
