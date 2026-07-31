import Link from "next/link";
import { InterventionForm } from "./InterventionForm";

export default function NouvelleInterventionPage() {
  return (
    <>
      <div className="space-y-1">
        <Link href="/artisan/espace" className="text-sm text-muted-foreground underline underline-offset-4">
          &larr; Retour à mon espace
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Soumettre une intervention
        </h1>
      </div>
      <InterventionForm />
    </>
  );
}
