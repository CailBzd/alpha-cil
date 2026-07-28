import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "../../../../../AppHeader";
import { ThemeToggle } from "../../../../../theme-toggle";
import { SignOutButton } from "../../SignOutButton";
import { DevisForm } from "./DevisForm";
import { DevisRow } from "./DevisRow";

export default async function ProjetDetailPage({
  params,
}: {
  params: Promise<{ projetId: string }>;
}) {
  const { projetId } = await params;

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

  // RLS already scopes this to the caller's own logement's projets — a
  // nonexistent or someone else's projet id simply comes back null.
  const { data: projet } = await supabase
    .from("projets")
    .select("id, nom")
    .eq("id", projetId)
    .maybeSingle();

  if (!projet) {
    redirect("/proprietaire/espace/projets");
  }

  const { data: devisList } = await supabase
    .from("devis")
    .select("id, contact_id, montant, conditions, statut, date_devis")
    .eq("projet_id", projet.id)
    .order("created_at", { ascending: false });

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, nom, telephone")
    .order("nom", { ascending: true });

  const contactsById = new Map((contacts ?? []).map((contact) => [contact.id, contact]));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader>
        <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
        <ThemeToggle />
        <SignOutButton />
      </AppHeader>
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <div className="space-y-1">
          <Link
            href="/proprietaire/espace/projets"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            &larr; Retour à mes projets
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{projet.nom}</h1>
        </div>

        {contacts && contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ajoutez d&apos;abord un{" "}
            <Link href="/proprietaire/espace/contacts" className="underline underline-offset-4">
              contact à votre carnet
            </Link>{" "}
            pour pouvoir lui associer un devis.
          </p>
        ) : (
          <DevisForm projetId={projet.id} contacts={contacts ?? []} />
        )}

        {devisList && devisList.length > 0 ? (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {devisList.map((devis) => (
              <DevisRow
                key={devis.id}
                devis={devis}
                contact={contactsById.get(devis.contact_id) ?? null}
                contacts={contacts ?? []}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun devis enregistré pour ce projet.</p>
        )}
      </main>
    </div>
  );
}
