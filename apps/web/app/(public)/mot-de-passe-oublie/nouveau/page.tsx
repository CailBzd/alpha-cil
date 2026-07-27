"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, AuthCard, Button, Input } from "@alpha-cil/ui";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ThemeToggle } from "../../../theme-toggle";

export default function NouveauMotDePassePage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const code = new URLSearchParams(window.location.search).get("code");

    if (!code) {
      // The implicit-flow hash fragment (#access_token=...&type=recovery),
      // if that's how this link was issued, is already picked up
      // automatically by the client on load — nothing to exchange.
      setReady(true);
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (exchangeError) {
        setError("Ce lien de réinitialisation est invalide ou expiré.");
        return;
      }
      setReady(true);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const password = form.get("password") as string;

    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setSubmitting(false);

    if (updateError) {
      setError("Impossible de mettre à jour le mot de passe. Réessayez.");
      return;
    }

    setDone(true);
  }

  return (
    <AuthCard title="Nouveau mot de passe" action={<ThemeToggle />}>
      {done ? (
        <p className="text-sm text-foreground">
          Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter :{" "}
          <Link
            href="/artisan/connexion"
            className="font-medium text-foreground underline underline-offset-4"
          >
            espace artisan
          </Link>{" "}
          ·{" "}
          <Link
            href="/proprietaire/connexion"
            className="font-medium text-foreground underline underline-offset-4"
          >
            espace propriétaire
          </Link>
        </p>
      ) : ready ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nouveau mot de passe"
            name="password"
            type="password"
            required
            autoComplete="new-password"
          />
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" disabled={submitting} className="w-full">
            Mettre à jour le mot de passe
          </Button>
        </form>
      ) : error ? (
        <Alert>{error}</Alert>
      ) : (
        <p className="text-sm text-muted-foreground">Vérification du lien…</p>
      )}
    </AuthCard>
  );
}
