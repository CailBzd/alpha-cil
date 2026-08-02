import { getServerSupabaseClient } from "@/lib/supabase-server";
import { RappelForm } from "./RappelForm";
import { RappelRow } from "./RappelRow";

export default async function RappelsPage() {
  const supabase = await getServerSupabaseClient();

  const [{ data: logement }, { data: contacts }] = await Promise.all([
    supabase.from("logements").select("id").maybeSingle(),
    supabase.from("contacts").select("id, nom, telephone").order("nom", { ascending: true }),
  ]);

  const { data: rappels } = logement
    ? await supabase
        .from("rappels")
        .select("id, titre, date_echeance, contact_id, notes, traite_a")
        .eq("logement_id", logement.id)
        .order("date_echeance", { ascending: true })
    : { data: null };

  const contactsById = new Map((contacts ?? []).map((contact) => [contact.id, contact]));

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Mes rappels</h1>
        <p className="text-sm text-muted-foreground">
          Vos propres rappels, distincts des rappels automatiques de chauffage/VMC — chacun peut
          être lié à un contact de votre carnet.
        </p>
      </div>

      {!logement ? (
        <p className="text-sm text-muted-foreground">
          Aucun logement n&apos;est encore lié à votre compte.
        </p>
      ) : (
        <>
          <RappelForm logementId={logement.id} contacts={contacts ?? []} />

          {rappels && rappels.length > 0 ? (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {rappels.map((rappel) => (
                <RappelRow
                  key={rappel.id}
                  rappel={rappel}
                  contact={rappel.contact_id ? (contactsById.get(rappel.contact_id) ?? null) : null}
                  contacts={contacts ?? []}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun rappel enregistré pour l&apos;instant.
            </p>
          )}
        </>
      )}
    </>
  );
}
