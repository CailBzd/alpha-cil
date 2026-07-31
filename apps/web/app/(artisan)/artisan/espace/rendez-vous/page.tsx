import { getServerSupabaseClient } from "@/lib/supabase-server";
import { ArtisanRendezVousRow } from "./ArtisanRendezVousRow";

export default async function ArtisanRendezVousPage() {
  const supabase = await getServerSupabaseClient();

  const { data: rendezVous } = await supabase
    .from("rendez_vous")
    .select("id, type_travaux, date_prevue, statut, notes, adresse_logement")
    .order("date_prevue", { ascending: true });

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Mes rendez-vous</h1>
      {rendezVous && rendezVous.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {rendezVous.map((rdv) => (
            <ArtisanRendezVousRow
              key={rdv.id}
              rendezVous={{
                id: rdv.id,
                type_travaux: rdv.type_travaux,
                date_prevue: rdv.date_prevue,
                statut: rdv.statut,
                notes: rdv.notes,
                adresse: rdv.adresse_logement,
              }}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucun rendez-vous ne vous a été associé pour l&apos;instant.
        </p>
      )}
    </>
  );
}
