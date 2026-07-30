"use client";

import { Alert, Button, Input } from "@alpha-cil/ui";
import { useState, type FormEvent } from "react";

export function ExportForm({
  interventions,
}: {
  interventions: { id: string; label: string }[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [includeAdresse, setIncludeAdresse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"pdf" | "lien" | null>(null);

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
    if (selected.size === 0 && !includeAdresse) {
      return window.confirm("Aucune information ne sera incluse. Continuer quand même ?");
    }
    return true;
  }

  async function handleDownloadPdf() {
    const confirmed = confirmIfEmpty();
    if (!confirmed) {
      return;
    }
    setError(null);
    setLoadingAction("pdf");

    try {
      const response = await fetch("/api/proprietaire/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interventionIds: Array.from(selected),
          includeAdresse,
          confirmed,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(
          data?.error === "empty_selection"
            ? "Sélectionnez au moins une information à inclure, ou cochez l'adresse."
            : "Impossible de générer le PDF. Réessayez.",
        );
        setLoadingAction(null);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "carnet-alpha-cil.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      setLoadingAction(null);
    } catch {
      setError("Impossible de générer le PDF. Réessayez.");
      setLoadingAction(null);
    }
  }

  async function handleCreateLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const confirmed = confirmIfEmpty();
    if (!confirmed) {
      return;
    }
    setError(null);
    setLink(null);
    setLoadingAction("lien");

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
          confirmed,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(
          errorData?.error === "empty_selection"
            ? "Sélectionnez au moins une intervention à partager."
            : "Impossible de créer le lien. Réessayez.",
        );
        setLoadingAction(null);
        return;
      }

      const data = (await response.json()) as { token: string };
      setLink(`${window.location.origin}/consultation?token=${data.token}`);
      setLoadingAction(null);
    } catch {
      setError("Impossible de créer le lien. Réessayez.");
      setLoadingAction(null);
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
      <label className="flex items-center gap-1.5 text-sm text-foreground">
        <input
          type="checkbox"
          checked={includeAdresse}
          onChange={(event) => setIncludeAdresse(event.target.checked)}
        />
        Inclure l&apos;adresse du logement (PDF uniquement — le lien reste toujours sans adresse)
      </label>
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
          disabled={loadingAction === "lien"}
          loading={loadingAction === "pdf"}
          onClick={handleDownloadPdf}
          className="flex-1"
        >
          Télécharger en PDF
        </Button>
        <Button
          type="submit"
          disabled={loadingAction === "pdf"}
          loading={loadingAction === "lien"}
          className="flex-1"
        >
          Générer un lien
        </Button>
      </div>
    </form>
  );
}
