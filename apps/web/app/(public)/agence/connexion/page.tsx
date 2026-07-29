"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, AuthCard, Button, Input } from "@alpha-cil/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ThemeToggle } from "../../../theme-toggle";

const CLAIM_ERROR_MESSAGES: Record<string, string> = {
  wrong_type: "Ce lien d'invitation n'est pas une invitation agence.",
  expired_or_revoked: "Cette invitation a expiré ou a été révoquée.",
  email_mismatch: "Cette invitation a été envoyée à une autre adresse email.",
  claimed_by_other: "Cette invitation a déjà été validée par un autre compte agence.",
  not_found: "Ce lien d'invitation est invalide.",
};

export default function AgenceConnexionPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [claimIssue, setClaimIssue] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setClaimIssue(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const token = new URLSearchParams(window.location.search).get("token");

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Identifiants invalides.");
      setSubmitting(false);
      return;
    }

    if (token) {
      const { data: reason } = await supabase.rpc("claim_agence_grant", { p_token: token });
      if (reason && reason !== "success") {
        setClaimIssue(CLAIM_ERROR_MESSAGES[reason] ?? "Impossible de valider cette invitation.");
        setSubmitting(false);
        return;
      }
    }

    router.push("/agence/espace");
  }

  return (
    <AuthCard
      title="Connexion agence"
      action={<ThemeToggle />}
      footer={
        <Link
          href="/mot-de-passe-oublie"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Mot de passe oublié ?
        </Link>
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
        {claimIssue ? (
          <>
            <Alert>{claimIssue}</Alert>
            <Link
              href="/agence/espace"
              className="block text-center text-sm font-medium text-foreground underline underline-offset-4"
            >
              Continuer vers mon espace
            </Link>
          </>
        ) : null}
        <Button type="submit" disabled={submitting} className="w-full">
          Se connecter
        </Button>
      </form>
    </AuthCard>
  );
}
