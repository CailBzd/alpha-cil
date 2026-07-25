"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Button, Input } from "@alpha-cil/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function ArtisanConnexionPage() {
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

    router.push("/artisan/espace");
  }

  return (
    <main>
      <h1>Alpha CIL</h1>
      <form onSubmit={handleSubmit}>
        <Input label="Email" name="email" type="email" required autoComplete="email" />
        <Input
          label="Mot de passe"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <Button type="submit" disabled={submitting}>
          Se connecter
        </Button>
        {error ? <p role="alert">{error}</p> : null}
      </form>
      <p>
        Pas de compte ? <Link href="/artisan/inscription">S&apos;inscrire</Link>
      </p>
    </main>
  );
}
