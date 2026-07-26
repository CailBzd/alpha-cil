"use client";

import { Alert, Button, Input } from "@alpha-cil/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AccesForm({
  interventions,
}: {
  interventions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [scope, setScope] = useState<"total" | "partiel">("total");
  const [tiersType, setTiersType] = useState<"agence" | "autre">("autre");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLink(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const interventionIds = form.getAll("interventionIds") as string[];

    try {
      const response = await fetch("/api/proprietaire/acces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiersEmail: form.get("tiersEmail"),
          tiersType,
          scope,
          expiresAt: form.get("expiresAt"),
          interventionIds: scope === "partiel" ? interventionIds : [],
        }),
      });

      if (!response.ok) {
        setError("Impossible de créer l'accès. Réessayez.");
        setSubmitting(false);
        return;
      }

      const data = (await response.json()) as { token: string };
      setLink(`${window.location.origin}/consultation?token=${data.token}`);
      setSubmitting(false);
      router.refresh();
    } catch {
      setError("Impossible de créer l'accès. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <Input label="Email du tiers" name="tiersEmail" type="email" required />
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-foreground">Type de tiers</span>
        <div className="flex gap-4 text-sm text-foreground">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={tiersType === "agence"}
              onChange={() => setTiersType("agence")}
            />
            Agence immobilière
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={tiersType === "autre"}
              onChange={() => setTiersType("autre")}
            />
            Autre
          </label>
        </div>
      </div>
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-foreground">Portée</span>
        <div className="flex gap-4 text-sm text-foreground">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={scope === "total"}
              onChange={() => setScope("total")}
            />
            Total
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={scope === "partiel"}
              onChange={() => setScope("partiel")}
            />
            Partiel
          </label>
        </div>
      </div>
      {scope === "partiel" ? (
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Interventions à partager</span>
          <div className="space-y-1">
            {interventions.length > 0 ? (
              interventions.map((intervention) => (
                <label key={intervention.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="interventionIds" value={intervention.id} />
                  {intervention.label}
                </label>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucune intervention à sélectionner.</p>
            )}
          </div>
        </div>
      ) : null}
      <Input label="Expire le" name="expiresAt" type="date" required />
      {error ? <Alert>{error}</Alert> : null}
      {link ? (
        <p className="break-all rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          Lien à partager : {link}
        </p>
      ) : null}
      <Button type="submit" disabled={submitting} className="w-full">
        Créer l&apos;accès
      </Button>
    </form>
  );
}
