"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, Button, Input } from "@alpha-cil/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface EntretienFieldProps {
  logementId: string;
  label: string;
  column: "derniere_verif_chauffage" | "derniere_verif_vmc";
  resetColumn: "rappel_chauffage_envoye_a" | "rappel_vmc_envoye_a";
  currentValue: string | null;
}

function EntretienField({ logementId, label, column, resetColumn, currentValue }: EntretienFieldProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from("logements")
      .update({ [column]: form.get("date"), [resetColumn]: null })
      .eq("id", logementId);

    if (updateError) {
      setError("Impossible d'enregistrer cette date. Réessayez.");
      setSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <Input label={label} name="date" type="date" defaultValue={currentValue ?? ""} required />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" disabled={submitting}>
        Enregistrer
      </Button>
    </form>
  );
}

export function EntretienForm({
  logementId,
  chauffageType,
  vmcType,
  derniereVerifChauffage,
  derniereVerifVmc,
}: {
  logementId: string;
  chauffageType: string | null;
  vmcType: string | null;
  derniereVerifChauffage: string | null;
  derniereVerifVmc: string | null;
}) {
  const chauffageEligible = chauffageType === "gaz" || chauffageType === "bois";
  const vmcEligible = vmcType === "simple_flux" || vmcType === "double_flux";

  if (!chauffageEligible && !vmcEligible) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-sm">
      {chauffageEligible ? (
        <EntretienField
          logementId={logementId}
          label={chauffageType === "bois" ? "Dernier ramonage" : "Dernier entretien de la chaudière"}
          column="derniere_verif_chauffage"
          resetColumn="rappel_chauffage_envoye_a"
          currentValue={derniereVerifChauffage}
        />
      ) : null}
      {vmcEligible ? (
        <EntretienField
          logementId={logementId}
          label="Dernier entretien de la VMC"
          column="derniere_verif_vmc"
          resetColumn="rappel_vmc_envoye_a"
          currentValue={derniereVerifVmc}
        />
      ) : null}
    </div>
  );
}
