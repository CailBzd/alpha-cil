import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InterventionProprietaireForm } from "./InterventionProprietaireForm";

export default async function NouvelleInterventionProprietairePage() {
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

  if (!logement) {
    redirect("/proprietaire/espace");
  }

  return (
    <>
      <div>
        <Link
          href="/proprietaire/espace"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          &larr; Retour à mon espace
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Ajouter une intervention
        </h1>
      </div>
      <InterventionProprietaireForm />
    </>
  );
}
