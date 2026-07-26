import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExportForm } from "./ExportForm";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });

export default async function ExportPage() {
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
          Exporter mon carnet
        </h1>
      </div>

      {logement ? (
        <div className="mt-6">
          <ExportForm
            interventions={(interventions ?? []).map((intervention) => ({
              id: intervention.id,
              label: `${dateFormatter.format(new Date(intervention.date_intervention))} — ${intervention.type_travaux}`,
            }))}
          />
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Aucun logement n&apos;est encore lié à votre compte.
        </p>
      )}
    </main>
  );
}
