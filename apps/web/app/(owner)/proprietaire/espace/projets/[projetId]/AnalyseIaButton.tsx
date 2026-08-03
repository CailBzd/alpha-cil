"use client";

import { Alert, Button } from "@foya/ui";
import { useState, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MARKDOWN_COMPONENTS = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => (
    <h3 className="text-sm font-semibold text-foreground" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h3 className="text-sm font-semibold text-foreground" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-sm font-semibold text-foreground" {...props} />
  ),
  h4: (props: ComponentPropsWithoutRef<"h4">) => (
    <h4 className="text-sm font-semibold text-foreground" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => <p className="text-sm" {...props} />,
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc space-y-1 pl-5 text-sm" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal space-y-1 pl-5 text-sm" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" {...props} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th className="border-b border-border px-2 py-1 font-semibold text-foreground" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td className="border-b border-border px-2 py-1" {...props} />
  ),
};

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
        <div className="space-y-3 rounded-md bg-secondary p-3 text-secondary-foreground">
          <div className="space-y-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
              {analyse.contenu}
            </ReactMarkdown>
          </div>
          <p className="text-xs text-muted-foreground">
            Analyse informative générée par IA ({analyse.modele}) — ne remplace pas l&apos;avis
            d&apos;un professionnel.
          </p>
        </div>
      ) : null}
    </div>
  );
}
