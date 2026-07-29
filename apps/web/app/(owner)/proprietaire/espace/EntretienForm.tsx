"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, Button, Input } from "@alpha-cil/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface EntretienFieldProps {
  logementId: string;
  label: string;
  column:
    | "derniere_verif_chauffage_gaz"
    | "derniere_verif_chauffage_bois"
    | "derniere_verif_vmc";
  resetColumn:
    | "rappel_chauffage_gaz_envoye_a"
    | "rappel_chauffage_bois_envoye_a"
    | "rappel_vmc_envoye_a";
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

    setSubmitting(false);
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
  derniereVerifChauffageGaz,
  derniereVerifChauffageBois,
  derniereVerifVmc,
}: {
  logementId: string;
  chauffageType: string[] | null;
  vmcType: string | null;
  derniereVerifChauffageGaz: string | null;
  derniereVerifChauffageBois: string | null;
  derniereVerifVmc: string | null;
}) {
  const gazEligible = chauffageType?.includes("gaz") ?? false;
  const boisEligible = chauffageType?.includes("bois") ?? false;
  const vmcEligible = vmcType === "simple_flux" || vmcType === "double_flux";

  if (!gazEligible && !boisEligible && !vmcEligible) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-sm">
      {gazEligible ? (
        <EntretienField
          logementId={logementId}
          label="Dernier entretien de la chaudière"
          column="derniere_verif_chauffage_gaz"
          resetColumn="rappel_chauffage_gaz_envoye_a"
          currentValue={derniereVerifChauffageGaz}
        />
      ) : null}
      {boisEligible ? (
        <EntretienField
          logementId={logementId}
          label="Dernier ramonage"
          column="derniere_verif_chauffage_bois"
          resetColumn="rappel_chauffage_bois_envoye_a"
          currentValue={derniereVerifChauffageBois}
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
