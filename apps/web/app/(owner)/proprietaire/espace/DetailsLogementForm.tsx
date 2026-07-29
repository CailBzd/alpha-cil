"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, Button, Input } from "@alpha-cil/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function DetailsLogementForm({
  logementId,
  nombrePieces,
  anneeConstruction,
}: {
  logementId: string;
  nombrePieces: number | null;
  anneeConstruction: number | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const pieces = form.get("nombrePieces");
    const annee = form.get("anneeConstruction");
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from("logements")
      .update({
        nombre_pieces: pieces ? Number(pieces) : null,
        annee_construction: annee ? Number(annee) : null,
      })
      .eq("id", logementId);

    if (updateError) {
      setError("Impossible d'enregistrer ces informations. Réessayez.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <Input
        label="Nombre de pièces"
        name="nombrePieces"
        type="number"
        min="1"
        defaultValue={nombrePieces ?? ""}
      />
      <Input
        label="Année de construction"
        name="anneeConstruction"
        type="number"
        min="1700"
        max={new Date().getFullYear()}
        defaultValue={anneeConstruction ?? ""}
      />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" disabled={submitting}>
        Enregistrer
      </Button>
    </form>
  );
}
