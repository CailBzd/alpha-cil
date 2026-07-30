"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, Button, Input, Select } from "@alpha-cil/ui";
import { CORPS_METIER_OPTIONS } from "@/lib/corps-metier";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ContactForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const corpsMetier = form.get("corpsMetier");
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Session expirée. Reconnectez-vous.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("contacts").insert({
      proprietaire_id: user.id,
      nom: form.get("nom"),
      corps_metier: corpsMetier || null,
      telephone: form.get("telephone") || null,
      email: form.get("email") || null,
      notes: form.get("notes") || null,
    });

    if (insertError) {
      setError("Impossible d'enregistrer ce contact. Réessayez.");
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
      <h2 className="text-sm font-semibold text-foreground">Ajouter un contact</h2>
      <Input label="Nom" name="nom" type="text" required />
      <Select
        label="Corps de métier"
        name="corpsMetier"
        defaultValue=""
        placeholder="Non renseigné"
        options={CORPS_METIER_OPTIONS.map((option) => ({ ...option }))}
      />
      <Input label="Téléphone" name="telephone" type="tel" />
      <Input label="Email" name="email" type="email" />
      <Input label="Notes" name="notes" type="text" />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" loading={submitting} className="w-full">
        Ajouter
      </Button>
    </form>
  );
}
