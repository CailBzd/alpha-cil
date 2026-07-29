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

  // Rendez-vous are visible under a 'total' grant only (RLS's
  // has_agence_grant_total already enforces this — the scope check here
  // just avoids an empty round-trip for a 'partiel' grant). A 'partiel'
  // grant means "only these specific past interventions I picked," not
  // "also see all upcoming appointments."
  const { data: rendezVous } =
    grant.scope === "total"
      ? await supabase
          .from("rendez_vous")
          .select("id, type_travaux, date_prevue, statut")
          .eq("logement_id", logementId)
          .order("date_prevue", { ascending: true })
      : { data: null };

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
      {rendezVous && rendezVous.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Rendez-vous</h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {rendezVous.map((rdv) => (
              <li
                key={rdv.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
              >
                <span className="flex-1 font-medium text-foreground">{rdv.type_travaux}</span>
                <span className="text-muted-foreground">
                  {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(
                    new Date(rdv.date_prevue),
                  )}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    rdv.statut === "validee"
                      ? "bg-secondary text-secondary-foreground"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {rdv.statut === "validee" ? "Validée" : "Provisoire"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
