"use client";

import { createBrowserSupabaseClient } from "@foya/db";
import { Alert, Button, Input } from "@foya/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ProjetForm({ logementId }: { logementId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const supabase = createBrowserSupabaseClient();
    const { data, error: insertError } = await supabase
      .from("projets")
      .insert({ logement_id: logementId, nom: form.get("nom") })
      .select("id")
      .single();

    if (insertError || !data) {
      setError("Impossible de créer ce projet. Réessayez.");
      setSubmitting(false);
      return;
    }

    router.push(`/proprietaire/espace/projets/${data.id}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <Input label="Nom du projet" name="nom" type="text" placeholder="Ex. Installer une clim" required />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" loading={submitting}>
        Créer le projet
      </Button>
    </form>
  );
}
