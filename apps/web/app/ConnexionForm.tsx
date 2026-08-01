"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, AuthCard, Button, Input, PasswordInput } from "@alpha-cil/ui";
import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

export interface ConnexionFormProps {
  title: string;
  redirectPath: string;
  /** Omitted for agence: agency accounts are invitation-only, never self-serve. */
  inscriptionHref?: string;
  /**
   * Runs once signInWithPassword succeeds, before redirecting — e.g.
   * agence's post-signin invitation-grant claim. Return a message to block
   * the redirect and show it instead; return nothing to redirect normally.
   */
  afterSignIn?: (supabase: SupabaseClient) => Promise<string | void>;
  /** Extra content shown alongside a blocked (afterSignIn) message. */
  blockedFooter?: ReactNode;
}

export function ConnexionForm({
  title,
  redirectPath,
  inscriptionHref,
  afterSignIn,
  blockedFooter,
}: ConnexionFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBlockedMessage(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(
        signInError.code === "email_not_confirmed"
          ? "Votre email n'est pas encore confirmé. Vérifiez votre boîte de réception (et vos spams) pour le lien de confirmation."
          : "Identifiants invalides.",
      );
      setSubmitting(false);
      return;
    }

    if (afterSignIn) {
      const message = await afterSignIn(supabase);
      if (message) {
        setBlockedMessage(message);
        setSubmitting(false);
        return;
      }
    }

    router.push(redirectPath);
  }

  return (
    <AuthCard
      title={title}
      action={<ThemeToggle />}
      footer={
        <>
          {inscriptionHref ? (
            <>
              Pas de compte ?{" "}
              <Link
                href={inscriptionHref}
                className="font-medium text-foreground underline underline-offset-4"
              >
                S&apos;inscrire
              </Link>
              <br />
            </>
          ) : null}
          <Link
            href="/mot-de-passe-oublie"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Mot de passe oublié ?
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" name="email" type="email" required autoComplete="email" />
        <PasswordInput
          label="Mot de passe"
          name="password"
          required
          autoComplete="current-password"
        />
        {error ? <Alert>{error}</Alert> : null}
        {blockedMessage ? (
          <>
            <Alert>{blockedMessage}</Alert>
            {blockedFooter}
          </>
        ) : null}
        <Button type="submit" loading={submitting} className="w-full">
          Se connecter
        </Button>
      </form>
    </AuthCard>
  );
}
