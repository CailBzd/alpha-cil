"use client";

import { Alert, Button, Input } from "@alpha-cil/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function DecennaleForm({ uploadedAt }: { uploadedAt: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/artisan/decennale", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(
          data?.error === "invalid_file_type"
            ? "L'attestation doit être un fichier PDF."
            : "Impossible d'enregistrer l'attestation. Réessayez.",
        );
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);
      router.refresh();
    } catch {
      setError("Impossible d'enregistrer l'attestation. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-foreground">
        {uploadedAt
          ? `Attestation décennale enregistrée le ${new Date(uploadedAt).toLocaleDateString("fr-FR")}.`
          : "Aucune attestation décennale renseignée pour l'instant."}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Attestation décennale (PDF)"
          name="attestation"
          type="file"
          accept="application/pdf"
          required
        />
        {error ? <Alert>{error}</Alert> : null}
        {success ? (
          <p className="text-sm text-foreground">Attestation enregistrée.</p>
        ) : null}
        <Button type="submit" loading={submitting} className="w-full">
          {uploadedAt ? "Remplacer l'attestation" : "Enregistrer l'attestation"}
        </Button>
      </form>
    </div>
  );
}
