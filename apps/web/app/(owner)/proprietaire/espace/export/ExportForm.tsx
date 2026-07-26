"use client";

import { Alert, Button, Input } from "@alpha-cil/ui";
import { useState, type FormEvent } from "react";

export function ExportForm({
  interventions,
}: {
  interventions: { id: string; label: string }[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function confirmIfEmpty() {
    if (selected.size === 0) {
      return window.confirm("Aucune information ne sera incluse. Continuer quand même ?");
    }
    return true;
  }

  async function handleDownloadPdf() {
    if (!confirmIfEmpty()) {
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/proprietaire/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interventionIds: Array.from(selected) }),
      });

      if (!response.ok) {
        setError("Impossible de générer le PDF. Réessayez.");
        setSubmitting(false);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "carnet-alpha-cil.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      setSubmitting(false);
    } catch {
      setError("Impossible de générer le PDF. Réessayez.");
      setSubmitting(false);
    }
  }

  async function handleCreateLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmIfEmpty()) {
      return;
    }
    setError(null);
    setLink(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/proprietaire/acces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiersEmail: form.get("destinataire"),
          tiersType: "autre",
          scope: "partiel",
          expiresAt: form.get("expiresAt"),
          interventionIds: Array.from(selected),
        }),
      });

      if (!response.ok) {
        setError("Impossible de créer le lien. Réessayez.");
        setSubmitting(false);
        return;
      }

      const data = (await response.json()) as { token: string };
      setLink(`${window.location.origin}/consultation?token=${data.token}`);
      setSubmitting(false);
    } catch {
      setError("Impossible de créer le lien. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleCreateLink}
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-foreground">Interventions à inclure</span>
        <div className="space-y-1">
          {interventions.length > 0 ? (
            interventions.map((intervention) => (
              <label key={intervention.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(intervention.id)}
                  onChange={() => toggle(intervention.id)}
                />
                {intervention.label}
              </label>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Aucune intervention à sélectionner.</p>
          )}
        </div>
      </div>
      <Input label="Destinataire (email ou nom)" name="destinataire" type="text" required />
      <Input label="Expire le" name="expiresAt" type="date" required />
      {error ? <Alert>{error}</Alert> : null}
      {link ? (
        <p className="break-all rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          Lien à partager : {link}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={handleDownloadPdf}
          className="flex-1"
        >
          Télécharger en PDF
        </Button>
        <Button type="submit" disabled={submitting} className="flex-1">
          Générer un lien
        </Button>
      </div>
    </form>
  );
}
