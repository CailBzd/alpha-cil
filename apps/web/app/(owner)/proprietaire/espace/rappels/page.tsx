import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "../../../../AppHeader";
import { ThemeToggle } from "../../../../theme-toggle";
import { SignOutButton } from "../SignOutButton";
import { RappelForm } from "./RappelForm";
import { RappelRow } from "./RappelRow";

export default async function RappelsPage() {
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

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, nom, telephone")
    .order("nom", { ascending: true });

  const { data: rappels } = logement
    ? await supabase
        .from("rappels")
        .select("id, titre, date_echeance, contact_id, notes, traite_a")
        .eq("logement_id", logement.id)
        .order("date_echeance", { ascending: true })
    : { data: null };

  const contactsById = new Map((contacts ?? []).map((contact) => [contact.id, contact]));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader>
        <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
        <ThemeToggle />
        <SignOutButton />
      </AppHeader>
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
        <div className="space-y-1">
          <Link
            href="/proprietaire/espace"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            &larr; Retour à mon espace
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mes rappels</h1>
          <p className="text-sm text-muted-foreground">
            Vos propres rappels, distincts des rappels automatiques de chauffage/VMC — chacun
            peut être lié à un contact de votre carnet.
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
      </main>
    </div>
  );
}
