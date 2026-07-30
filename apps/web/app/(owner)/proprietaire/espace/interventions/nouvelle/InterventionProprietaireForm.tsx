"use client";

import { Alert, Button, Input, Select } from "@alpha-cil/ui";
import { CORPS_METIER_OPTIONS } from "@/lib/corps-metier";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function InterventionProprietaireForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/proprietaire/interventions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(
          data?.error === "invalid_file_type"
            ? "La facture doit être un fichier PDF."
            : "Impossible d'enregistrer l'intervention. Réessayez.",
        );
        setSubmitting(false);
        return;
      }

      router.push("/proprietaire/espace");
    } catch {
      setError("Impossible d'enregistrer l'intervention. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <Input label="Type de travaux" name="typeTravaux" type="text" required />
      <Input label="Date de l'intervention" name="dateIntervention" type="date" required />
      <Input
        label="Montant (€)"
        name="montantEuros"
        type="number"
        step="0.01"
        min="0.01"
        required
      />
      <Select
        label="Corps de métier"
        name="corpsMetier"
        required
        defaultValue=""
        placeholder="Sélectionnez un corps de métier"
        options={CORPS_METIER_OPTIONS.map((option) => ({ ...option }))}
      />
      <Input label="Facture (PDF, optionnel)" name="facture" type="file" accept="application/pdf" />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" loading={submitting} className="w-full">
        Enregistrer l&apos;intervention
      </Button>
    </form>
  );
}
