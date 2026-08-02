import { getServerSupabaseClient } from "@/lib/supabase-server";
import { CalendrierClient } from "./CalendrierClient";

export default async function CalendrierPage() {
  const supabase = await getServerSupabaseClient();

  const { data: logement } = await supabase.from("logements").select("id").maybeSingle();

  const { data: interventions } = logement
    ? await supabase
        .from("interventions")
        .select("id, type_travaux, date_intervention, montant_euros, duree_heures")
        .eq("logement_id", logement.id)
    : { data: null };

  const { data: rappels } = logement
    ? await supabase
        .from("rappels")
        .select("id, titre, date_echeance, traite_a")
        .eq("logement_id", logement.id)
    : { data: null };

  const { data: rendezVous } = logement
    ? await supabase
        .from("rendez_vous")
        .select(
          "id, type_travaux, date_prevue, statut, artisan_id, artisan_email, notes, contact_id",
        )
        .eq("logement_id", logement.id)
        .order("date_prevue", { ascending: true })
    : { data: null };

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, nom")
    .order("nom", { ascending: true });

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Calendrier</h1>
        <p className="text-sm text-muted-foreground">
          Vos interventions, rendez-vous et rappels, au même endroit.
        </p>
      </div>

      {!logement ? (
        <p className="text-sm text-muted-foreground">
          Aucun logement n&apos;est encore lié à votre compte.
        </p>
      ) : (
        <CalendrierClient
          logementId={logement.id}
          interventions={interventions ?? []}
          rappels={rappels ?? []}
          rendezVous={rendezVous ?? []}
          contacts={contacts ?? []}
        />
      )}
    </>
  );
}
