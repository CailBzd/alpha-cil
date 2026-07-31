import { getServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InterventionProprietaireForm } from "./InterventionProprietaireForm";

export default async function NouvelleInterventionProprietairePage() {
  const supabase = await getServerSupabaseClient();

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
