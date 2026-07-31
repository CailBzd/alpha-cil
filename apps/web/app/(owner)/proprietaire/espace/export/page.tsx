import { dateFormatter } from "@/lib/formatters";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { ExportForm } from "./ExportForm";

export default async function ExportPage() {
  const supabase = await getServerSupabaseClient();

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
