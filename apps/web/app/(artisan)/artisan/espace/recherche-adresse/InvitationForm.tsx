"use client";

import { Alert, Button, Input } from "@alpha-cil/ui";
import { useState, type FormEvent } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  adresse_ambigue: "Plusieurs logements correspondent à cette adresse, invitation impossible.",
  compte_existant: "Un compte a été créé entre-temps pour cette adresse.",
};

export function InvitationForm({ adresse }: { adresse: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const response = await fetch("/api/artisan/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adresse, email }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(
          (data?.error && ERROR_MESSAGES[data.error]) ??
            "Impossible d'envoyer l'invitation. Réessayez.",
        );
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);
    } catch {
      setError("Impossible d'envoyer l'invitation. Réessayez.");
      setSubmitting(false);
    }
  }

  if (success) {
    return <p className="text-sm font-medium text-foreground">Invitation envoyée à {email}.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-border pt-4">
      <p className="text-sm text-muted-foreground">
        Invitez le client à créer son compte pour ce logement.
      </p>
      <Input
        label="Email du client"
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" disabled={email.trim().length === 0} loading={submitting}>
        Envoyer l&apos;invitation
      </Button>
    </form>
  );
}
