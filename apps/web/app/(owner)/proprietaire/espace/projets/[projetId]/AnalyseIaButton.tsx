"use client";

import { Alert, Button } from "@foya/ui";
import { useState } from "react";

interface Analyse {
  contenu: string;
  modele: string;
  created_at: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  quota_depasse:
    "Vous avez déjà utilisé votre analyse gratuite pour ce projet. Passez à l'offre payante pour une analyse quotidienne.",
  forbidden: "Vous n'avez pas accès à ce projet.",
  aucun_devis: "Ajoutez au moins un devis avant de lancer une analyse.",
  ai_indisponible: "Le service d'analyse est momentanément indisponible. Réessayez plus tard.",
};

export function AnalyseIaButton({
  projetId,
  derniereAnalyse,
}: {
  projetId: string;
  derniereAnalyse: Analyse | null;
}) {
  const [analyse, setAnalyse] = useState<Analyse | null>(derniereAnalyse);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/proprietaire/projets/${projetId}/analyse-ia`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(
          (data?.error && ERROR_MESSAGES[data.error]) ??
            "Impossible de générer l'analyse. Réessayez.",
        );
        setSubmitting(false);
        return;
      }

      const data = (await response.json()) as { analyse: Analyse };
      setAnalyse(data.analyse);
      setSubmitting(false);
    } catch {
      setError("Impossible de générer l'analyse. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">Comparatif de devis par IA</span>
        <Button type="button" loading={submitting} onClick={handleClick}>
          {analyse ? "Relancer l'analyse" : "Lancer l'analyse"}
        </Button>
      </div>
      {error ? <Alert>{error}</Alert> : null}
      {analyse ? (
        <div className="space-y-1 rounded-md bg-secondary p-3 text-sm text-secondary-foreground">
          <p className="whitespace-pre-wrap">{analyse.contenu}</p>
          <p className="text-xs text-muted-foreground">
            Analyse informative générée par IA ({analyse.modele}) — ne remplace pas l&apos;avis
            d&apos;un professionnel.
          </p>
        </div>
      ) : null}
    </div>
  );
}
