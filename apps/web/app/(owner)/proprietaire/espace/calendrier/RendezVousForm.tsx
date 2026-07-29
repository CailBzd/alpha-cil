"use client";

import { Alert, Button, Input, Select } from "@alpha-cil/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function RendezVousForm({
  contacts,
}: {
  contacts: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/rendez-vous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeTravaux: form.get("typeTravaux"),
          datePrevue: form.get("datePrevue"),
          contactId: form.get("contactId") || null,
          artisanEmail: form.get("artisanEmail") || null,
          notes: form.get("notes") || null,
        }),
      });

      if (!response.ok) {
        setError("Impossible de créer ce rendez-vous. Réessayez.");
        setSubmitting(false);
        return;
      }

      (event.target as HTMLFormElement).reset();
      setSubmitting(false);
      router.refresh();
    } catch {
      setError("Impossible de créer ce rendez-vous. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-foreground">Planifier un rendez-vous</h2>
      <Input label="Type de travaux" name="typeTravaux" type="text" required />
      <Input label="Date prévue" name="datePrevue" type="date" required />
      <Select
        label="Contact lié"
        name="contactId"
        defaultValue=""
        placeholder="Aucun"
        options={contacts.map((contact) => ({ value: contact.id, label: contact.nom }))}
      />
      <Input
        label="Email de l'artisan (optionnel)"
        name="artisanEmail"
        type="email"
        placeholder="Pour lui permettre de voir/modifier ce rendez-vous"
      />
      <Input label="Notes" name="notes" type="text" />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" disabled={submitting} className="w-full">
        Planifier
      </Button>
    </form>
  );
}
