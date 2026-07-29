import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import Link from "next/link";
import { ProjetForm } from "./ProjetForm";

export default async function ProjetsPage() {
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

  const { data: logement } = await supabase.from("logements").select("id").maybeSingle();

  const { data: projets } = logement
    ? await supabase
        .from("projets")
        .select("id, nom, created_at")
        .eq("logement_id", logement.id)
        .order("created_at", { ascending: false })
    : { data: null };

  const { data: devisCounts } = projets && projets.length > 0
    ? await supabase
        .from("devis")
        .select("id, projet_id")
        .in("projet_id", projets.map((projet) => projet.id))
    : { data: null };

  const countByProjet = new Map<string, number>();
  for (const devis of devisCounts ?? []) {
    countByProjet.set(devis.projet_id, (countByProjet.get(devis.projet_id) ?? 0) + 1);
  }

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Mes projets</h1>
        <p className="text-sm text-muted-foreground">
          Regroupez plusieurs devis d&apos;un même besoin (ex. « installer une clim ») pour les
          comparer côte à côte avant de commander les travaux.
        </p>
      </div>

      {!logement ? (
        <p className="text-sm text-muted-foreground">
          Aucun logement n&apos;est encore lié à votre compte.
        </p>
      ) : (
        <>
          <ProjetForm logementId={logement.id} />

          {projets && projets.length > 0 ? (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {projets.map((projet) => (
                <li
                  key={projet.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <Link
                    href={`/proprietaire/espace/projets/${projet.id}`}
                    className="flex-1 font-medium text-foreground underline underline-offset-4"
                  >
                    {projet.nom}
                  </Link>
                  <span className="text-muted-foreground">
                    {countByProjet.get(projet.id) ?? 0} devis
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun projet enregistré pour l&apos;instant.
            </p>
          )}
        </>
      )}
    </>
  );
}
