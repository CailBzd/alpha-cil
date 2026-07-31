import { dateFormatter } from "@/lib/formatters";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";

export default async function EspaceAgencePage() {
  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: grants } = await supabase
    .from("logement_access_grants")
    .select("id, expires_at, logement_id")
    .eq("agence_id", user?.id ?? "")
    .is("revoked_at", null)
    .order("expires_at", { ascending: true });

  const now = new Date();
  const activeGrants = (grants ?? []).filter((grant) => new Date(grant.expires_at) > now);

  const { data: logements } = activeGrants.length > 0
    ? await supabase
        .from("logements")
        .select("id, adresse")
        .in(
          "id",
          activeGrants.map((grant) => grant.logement_id),
        )
    : { data: null };

  const adresseById = new Map((logements ?? []).map((logement) => [logement.id, logement.adresse]));

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Logements</h1>
      {activeGrants.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {activeGrants.map((grant) => (
            <li
              key={grant.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
            >
              <Link
                href={`/agence/espace/logements/${grant.logement_id}`}
                className="flex-1 font-medium text-foreground underline underline-offset-4"
              >
                {adresseById.get(grant.logement_id) ?? "Adresse inconnue"}
              </Link>
              <span className="text-muted-foreground">
                Accès jusqu&apos;au {dateFormatter.format(new Date(grant.expires_at))}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucun logement ne vous a été partagé pour l&apos;instant.
        </p>
      )}
    </>
  );
}
