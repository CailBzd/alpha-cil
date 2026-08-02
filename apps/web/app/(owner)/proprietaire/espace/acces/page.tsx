import { dateFormatter } from "@/lib/formatters";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { AccesForm } from "./AccesForm";
import { RevokeButton } from "./RevokeButton";

export default async function AccesPage() {
  const supabase = await getServerSupabaseClient();

  const { data: logement } = await supabase.from("logements").select("id").maybeSingle();

  const [{ data: interventions }, { data: grants }] = logement
    ? await Promise.all([
        supabase
          .from("interventions")
          .select("id, type_travaux, date_intervention")
          .eq("logement_id", logement.id)
          .order("date_intervention", { ascending: false }),
        supabase
          .from("logement_access_grants")
          .select("id, tiers_email, tiers_type, scope, expires_at, revoked_at")
          .eq("logement_id", logement.id)
          .is("revoked_at", null)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: null }, { data: null }];

  const now = new Date();
  const activeGrants = (grants ?? []).filter((grant) => new Date(grant.expires_at) > now);

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Gérer les accès</h1>

      {logement ? (
        <>
          <AccesForm
            interventions={(interventions ?? []).map((intervention) => ({
              id: intervention.id,
              label: `${dateFormatter.format(new Date(intervention.date_intervention))} — ${intervention.type_travaux}`,
            }))}
          />

          <h2 className="text-lg font-semibold tracking-tight text-foreground">Accès actifs</h2>
          {activeGrants.length > 0 ? (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {activeGrants.map((grant) => (
                <li
                  key={grant.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
                >
                  <span className="flex-1 font-medium text-foreground">{grant.tiers_email}</span>
                  <span className="text-muted-foreground">
                    {grant.tiers_type === "agence" ? "Agence immobilière" : "Autre"}
                  </span>
                  <span className="text-muted-foreground">
                    {grant.scope === "total" ? "Accès total" : "Accès partiel"}
                  </span>
                  <span className="text-muted-foreground">
                    Expire le {dateFormatter.format(new Date(grant.expires_at))}
                  </span>
                  <RevokeButton grantId={grant.id} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun accès actif pour l&apos;instant.</p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucun logement n&apos;est encore lié à votre compte.
        </p>
      )}
    </>
  );
}
