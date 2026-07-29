"use client";

import { Alert, Button, Input } from "@alpha-cil/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdresseForm({ logementId, adresse }: { logementId: string; adresse: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/proprietaire/logement/adresse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logementId, adresse: form.get("adresse") }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(
          data?.error === "adresse_unavailable"
            ? "Cette adresse est déjà associée à un autre compte, ou correspond à plusieurs logements."
            : "Impossible de modifier l'adresse. Réessayez.",
        );
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      router.refresh();
    } catch {
      setError("Impossible de modifier l'adresse. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <Input label="Adresse du logement" name="adresse" type="text" defaultValue={adresse} required />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" disabled={submitting}>
        Modifier l&apos;adresse
      </Button>
    </form>
  );
}
