"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, Button, Input, Select } from "@alpha-cil/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function RappelForm({
  logementId,
  contacts,
}: {
  logementId: string;
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
    const contactId = form.get("contactId");
    const supabase = createBrowserSupabaseClient();
    const { error: insertError } = await supabase.from("rappels").insert({
      logement_id: logementId,
      titre: form.get("titre"),
      date_echeance: form.get("dateEcheance"),
      contact_id: contactId || null,
      notes: form.get("notes") || null,
    });

    if (insertError) {
      setError("Impossible d'enregistrer ce rappel. Réessayez.");
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
      <h2 className="text-sm font-semibold text-foreground">Ajouter un rappel</h2>
      <Input label="Titre" name="titre" type="text" required />
      <Input label="Échéance" name="dateEcheance" type="date" required />
      <Select
        label="Contact lié"
        name="contactId"
        defaultValue=""
        placeholder="Aucun"
        options={contacts.map((contact) => ({ value: contact.id, label: contact.nom }))}
      />
      <Input label="Notes" name="notes" type="text" />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" disabled={submitting} className="w-full">
        Ajouter
      </Button>
    </form>
  );
}
