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
  chauffageType: string[] | null;
  vmcType: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const chauffageTypes = form.getAll("chauffageType") as string[];

    if (chauffageTypes.length === 0) {
      setError("Sélectionnez au moins un type de chauffage.");
      return;
    }

    setSubmitting(true);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from("logements")
      .update({
        chauffage_type: chauffageTypes,
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
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-foreground">Type(s) de chauffage</span>
        <div className="space-y-1">
          {CHAUFFAGE_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                name="chauffageType"
                value={option.value}
                defaultChecked={chauffageType?.includes(option.value) ?? false}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
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
