"use client";

import { Alert, Button, Input } from "@foya/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AttestationEntretienUpload({
  type,
  label,
  uploadedAt,
}: {
  type: "vmc" | "chauffage_gaz" | "chauffage_bois";
  label: string;
  uploadedAt: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("type", type);

    try {
      const response = await fetch("/api/proprietaire/entretien-attestation", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(
          data?.error === "invalid_file_type"
            ? "Le justificatif doit être un fichier PDF."
            : "Impossible d'enregistrer le justificatif. Réessayez.",
        );
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      router.refresh();
    } catch {
      setError("Impossible d'enregistrer le justificatif. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <Input label={label} name="attestation" type="file" accept="application/pdf" required />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" loading={submitting}>
        {uploadedAt ? "Remplacer" : "Enregistrer"}
      </Button>
      {uploadedAt ? (
        <span className="w-full text-xs text-muted-foreground">
          Justificatif enregistré le {new Date(uploadedAt).toLocaleDateString("fr-FR")}.
        </span>
      ) : null}
    </form>
  );
}
