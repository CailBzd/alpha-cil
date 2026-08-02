"use client";

import { Alert, AuthCard, Button, Input, PasswordInput } from "@foya/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ThemeToggle } from "../../../theme-toggle";

export function ProprietaireInscriptionForm({
  token,
  invitationAdresse,
  invitationInvalid,
}: {
  token: string | null;
  invitationAdresse: string | null;
  invitationInvalid: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const password = form.get("password");
    const passwordConfirmation = form.get("passwordConfirmation");

    if (password !== passwordConfirmation) {
      setError("Les mots de passe ne correspondent pas.");
      setSubmitting(false);
      return;
    }

    const body = {
      email: form.get("email"),
      password,
      token,
    };

    try {
      const response = await fetch("/api/proprietaire/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(
          data?.error === "email_taken"
            ? "Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email."
            : "Impossible de créer le compte. Réessayez.",
        );
        setSubmitting(false);
        return;
      }

      router.push("/proprietaire/espace");
    } catch {
      setError("Impossible de créer le compte. Réessayez.");
      setSubmitting(false);
    }
  }

  if (invitationInvalid) {
    return (
      <AuthCard title="Créer mon compte propriétaire" action={<ThemeToggle />}>
        <Alert>Ce lien d&apos;invitation est invalide, expiré ou déjà utilisé.</Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Créer mon compte propriétaire"
      action={<ThemeToggle />}
      footer={
        <>
          Déjà un compte ?{" "}
          <Link
            href="/proprietaire/connexion"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Se connecter
          </Link>
        </>
      }
    >
      {invitationAdresse ? (
        <p className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          Vous avez été invité à rejoindre le carnet de <strong>{invitationAdresse}</strong>.
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" name="email" type="email" required autoComplete="email" />
        <PasswordInput
          label="Mot de passe"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <PasswordInput
          label="Confirmer le mot de passe"
          name="passwordConfirmation"
          required
          minLength={8}
          autoComplete="new-password"
        />
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" loading={submitting} className="w-full">
          Créer mon compte
        </Button>
      </form>
    </AuthCard>
  );
}
