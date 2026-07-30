"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, AuthCard, Button, Input } from "@alpha-cil/ui";
import { useState, type FormEvent } from "react";
import { ThemeToggle } from "../../theme-toggle";

export default function MotDePasseOubliePage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = form.get("email") as string;

    const supabase = createBrowserSupabaseClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/mot-de-passe-oublie/nouveau`,
    });

    setSubmitting(false);

    if (resetError) {
      setError("Impossible d'envoyer l'email. Réessayez.");
      return;
    }

    // Always show the same success message whether or not the email exists,
    // so this form can never be used to discover which emails have an
    // account.
    setSent(true);
  }

  return (
    <AuthCard title="Mot de passe oublié" action={<ThemeToggle />}>
      {sent ? (
        <p className="text-sm text-foreground">
          Si un compte existe avec cet email, un lien de réinitialisation vient de lui être
          envoyé.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" name="email" type="email" required autoComplete="email" />
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" loading={submitting} className="w-full">
            Envoyer le lien de réinitialisation
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
