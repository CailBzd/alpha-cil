import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
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

  const { data: logement } = await supabase.from("logements").select("id").maybeSingle();

  const { data: interventions } = logement
    ? await supabase
        .from("interventions")
        .select("id, type_travaux, date_intervention")
        .eq("logement_id", logement.id)
        .order("date_intervention", { ascending: false })
    : { data: null };

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Exporter mon carnet</h1>

      {logement ? (
        <ExportForm
          interventions={(interventions ?? []).map((intervention) => ({
            id: intervention.id,
            label: `${dateFormatter.format(new Date(intervention.date_intervention))} — ${intervention.type_travaux}`,
          }))}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucun logement n&apos;est encore lié à votre compte.
        </p>
      )}
    </>
  );
}
