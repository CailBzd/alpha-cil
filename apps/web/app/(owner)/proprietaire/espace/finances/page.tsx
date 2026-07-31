import { corpsMetierLabel } from "@/lib/corps-metier";
import { montantFormatter } from "@/lib/formatters";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { FinancesCharts } from "./FinancesCharts";

export default async function FinancesPage() {
  const supabase = await getServerSupabaseClient();

  const { data: logement } = await supabase.from("logements").select("id").maybeSingle();

  const { data: interventions } = logement
    ? await supabase
        .from("interventions")
        .select("montant_euros, date_intervention, corps_metier, artisan_id")
        .eq("logement_id", logement.id)
    : { data: null };

  const rows = interventions ?? [];
  const total = rows.reduce((sum, row) => sum + Number(row.montant_euros), 0);
  const totalArtisan = rows
    .filter((row) => row.artisan_id !== null)
    .reduce((sum, row) => sum + Number(row.montant_euros), 0);
  const totalDiy = total - totalArtisan;

  const byYearMap = new Map<number, number>();
  for (const row of rows) {
    const year = new Date(row.date_intervention).getUTCFullYear();
    byYearMap.set(year, (byYearMap.get(year) ?? 0) + Number(row.montant_euros));
  }
  const byYear = Array.from(byYearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, montant]) => ({ label: String(year), montant }));

  const byCorpsMetierMap = new Map<string, number>();
  for (const row of rows) {
    byCorpsMetierMap.set(
      row.corps_metier,
      (byCorpsMetierMap.get(row.corps_metier) ?? 0) + Number(row.montant_euros),
    );
  }
  const byCorpsMetier = Array.from(byCorpsMetierMap.entries())
    .map(([value, montant]) => ({ label: corpsMetierLabel(value), montant }))
    .sort((a, b) => b.montant - a.montant);

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Suivi financier</h1>

      {!logement ? (
        <p className="text-sm text-muted-foreground">
          Aucun logement n&apos;est encore lié à votre compte.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune intervention chiffrée pour ce logement pour l&apos;instant.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Total dépensé</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                {montantFormatter.format(total)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Réalisé par un artisan</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                {montantFormatter.format(totalArtisan)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Travaux personnels</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                {montantFormatter.format(totalDiy)}
              </p>
            </div>
          </div>

          <FinancesCharts byYear={byYear} byCorpsMetier={byCorpsMetier} />
        </>
      )}
    </>
  );
}
