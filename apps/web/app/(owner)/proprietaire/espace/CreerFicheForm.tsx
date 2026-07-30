"use client";

import { Alert, Button, Input } from "@alpha-cil/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreerFicheForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/proprietaire/logement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adresse: form.get("adresse") }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(
          data?.error === "adresse_unavailable"
            ? "Cette adresse est déjà associée à un autre compte, ou correspond à plusieurs logements."
            : "Impossible de créer la fiche. Réessayez.",
        );
        setSubmitting(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Impossible de créer la fiche. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        Créer ma fiche logement
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Adresse du logement" name="adresse" type="text" required />
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" loading={submitting} className="w-full">
          Créer ma fiche
        </Button>
      </form>
    </div>
  );
}
