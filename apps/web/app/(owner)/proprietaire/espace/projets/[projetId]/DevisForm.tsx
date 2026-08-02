"use client";

import { createBrowserSupabaseClient } from "@foya/db";
import { Alert, Button, Input, Select } from "@foya/ui";
import { DEVIS_STATUT_OPTIONS } from "@/lib/devis";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function DevisForm({
  projetId,
  contacts,
}: {
  projetId: string;
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
    const montant = form.get("montant");
    const dateDevis = form.get("dateDevis");
    const supabase = createBrowserSupabaseClient();
    const { error: insertError } = await supabase.from("devis").insert({
      projet_id: projetId,
      contact_id: form.get("contactId"),
      montant: montant ? Number(montant) : null,
      conditions: form.get("conditions") || null,
      statut: form.get("statut"),
      date_devis: dateDevis || null,
    });

    if (insertError) {
      setError("Impossible d'enregistrer ce devis. Réessayez.");
      setSubmitting(false);
      return;
    }

    (event.target as HTMLFormElement).reset();
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-foreground">Ajouter un devis</h2>
      <Select
        label="Contact"
        name="contactId"
        required
        defaultValue=""
        placeholder="Sélectionnez un contact"
        options={contacts.map((contact) => ({ value: contact.id, label: contact.nom }))}
      />
      <Select
        label="Statut"
        name="statut"
        required
        defaultValue="demande"
        options={DEVIS_STATUT_OPTIONS.map((option) => ({ ...option }))}
      />
      <Input label="Montant (€, optionnel)" name="montant" type="number" step="0.01" min="0.01" />
      <Input label="Date du devis (optionnel)" name="dateDevis" type="date" />
      <Input label="Conditions (optionnel)" name="conditions" type="text" />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" loading={submitting} className="w-full">
        Ajouter
      </Button>
    </form>
  );
}
