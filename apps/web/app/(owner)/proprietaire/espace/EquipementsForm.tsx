"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, Button, Select } from "@alpha-cil/ui";
import { CHAUFFAGE_OPTIONS, VMC_OPTIONS } from "@/lib/equipements";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function EquipementsForm({
  logementId,
  chauffageType,
  vmcType,
}: {
  logementId: string;
  chauffageType: string | null;
  vmcType: string | null;
}) {
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
      .update({
        chauffage_type: form.get("chauffageType"),
        vmc_type: form.get("vmcType"),
      })
      .eq("id", logementId);

    if (updateError) {
      setError("Impossible d'enregistrer vos équipements. Réessayez.");
      setSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <Select
        label="Type de chauffage"
        name="chauffageType"
        required
        defaultValue={chauffageType ?? ""}
        placeholder="Sélectionnez un type de chauffage"
        options={CHAUFFAGE_OPTIONS.map((option) => ({ ...option }))}
      />
      <Select
        label="VMC"
        name="vmcType"
        required
        defaultValue={vmcType ?? ""}
        placeholder="Sélectionnez un type de VMC"
        options={VMC_OPTIONS.map((option) => ({ ...option }))}
      />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" disabled={submitting} className="w-full">
        Enregistrer
      </Button>
    </form>
  );
}
