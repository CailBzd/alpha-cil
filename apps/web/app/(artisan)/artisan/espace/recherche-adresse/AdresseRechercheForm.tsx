"use client";

import { Alert, Button, Input } from "@alpha-cil/ui";
import { useState, type FormEvent } from "react";

export function AdresseRechercheForm() {
  const [adresse, setAdresse] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/artisan/adresse-recherche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adresse }),
      });

      if (!response.ok) {
        setError("Impossible d'effectuer la recherche. Réessayez.");
        setSubmitting(false);
        return;
      }

      const data = (await response.json()) as { exists: boolean };
      setResult(data.exists);
      setSubmitting(false);
    } catch {
      setError("Impossible d'effectuer la recherche. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Vérifiez si un compte existe déjà pour une adresse, sans accéder à aucune autre
        information sur le logement.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Adresse"
          name="adresse"
          value={adresse}
          onChange={(event) => setAdresse(event.target.value)}
          required
        />
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" disabled={submitting || adresse.trim().length === 0}>
          Rechercher
        </Button>
      </form>
      {result !== null ? (
        <p className="text-sm font-medium text-foreground">
          {result
            ? "Un compte existe déjà pour cette adresse."
            : "Aucun compte n'existe pour cette adresse."}
        </p>
      ) : null}
    </div>
  );
}
