import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccesForm } from "./AccesForm";
import { RevokeButton } from "./RevokeButton";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });

export default async function AccesPage() {
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

  if (!user) {
    redirect("/proprietaire/connexion");
  }

  const { data: logement } = await supabase.from("logements").select("id").maybeSingle();

  const { data: interventions } = logement
    ? await supabase
        .from("interventions")
        .select("id, type_travaux, date_intervention")
        .eq("logement_id", logement.id)
        .order("date_intervention", { ascending: false })
    : { data: null };

  const { data: grants } = logement
    ? await supabase
        .from("logement_access_grants")
        .select("id, tiers_email, tiers_type, scope, expires_at, revoked_at")
        .eq("logement_id", logement.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false })
    : { data: null };

  const now = new Date();
  const activeGrants = (grants ?? []).filter((grant) => new Date(grant.expires_at) > now);

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <div className="space-y-1">
        <Link
          href="/proprietaire/espace"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          &larr; Retour à mon espace
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Gérer les accès
        </h1>
      </div>

      {logement ? (
        <>
          <div className="mt-6">
            <AccesForm
              interventions={(interventions ?? []).map((intervention) => ({
                id: intervention.id,
                label: `${dateFormatter.format(new Date(intervention.date_intervention))} — ${intervention.type_travaux}`,
              }))}
            />
          </div>

          <h2 className="mt-8 text-lg font-semibold tracking-tight text-foreground">
            Accès actifs
          </h2>
          {activeGrants.length > 0 ? (
            <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-card">
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
            <p className="mt-2 text-sm text-muted-foreground">Aucun accès actif pour l&apos;instant.</p>
          )}
        </>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Aucun logement n&apos;est encore lié à votre compte.
        </p>
      )}
    </main>
  );
}
