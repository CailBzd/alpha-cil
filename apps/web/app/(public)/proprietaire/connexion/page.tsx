"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, AuthCard, Button, Input } from "@alpha-cil/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ThemeToggle } from "../../../theme-toggle";

export default function ProprietaireConnexionPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Identifiants invalides.");
      setSubmitting(false);
      return;
    }

    router.push("/proprietaire/espace");
  }

  return (
    <AuthCard
      title="Connexion propriétaire"
      action={<ThemeToggle />}
      footer={
        <>
          Pas de compte ?{" "}
          <Link
            href="/proprietaire/inscription"
            className="font-medium text-foreground underline underline-offset-4"
          >
            S&apos;inscrire
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" name="email" type="email" required autoComplete="email" />
        <Input
          label="Mot de passe"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" disabled={submitting} className="w-full">
          Se connecter
        </Button>
      </form>
    </AuthCard>
  );
}
