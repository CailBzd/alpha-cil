import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { ContactForm } from "./ContactForm";
import { ContactRow } from "./ContactRow";

export default async function ContactsPage() {
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

  const { data: contacts } = await supabase
    .from("contacts")
    .select(
      "id, nom, siret, alias, corps_metier, telephone, email, interlocuteur_prenom, interlocuteur_nom, notes",
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Carnet de contacts</h1>
        <p className="text-sm text-muted-foreground">
          Vos propres contacts de professionnels — qu&apos;ils aient déjà travaillé sur ce logement
          ou non. Distinct des artisans inscrits sur la plateforme.
        </p>
      </div>

      <ContactForm />

      {contacts && contacts.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {contacts.map((contact) => (
            <ContactRow key={contact.id} contact={contact} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun contact enregistré pour l&apos;instant.</p>
      )}
    </>
  );
}
