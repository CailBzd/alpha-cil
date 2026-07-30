"use client";

import { Alert, AuthCard, Button, Input, PasswordInput } from "@alpha-cil/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ThemeToggle } from "../../../theme-toggle";

export function AgenceInscriptionForm({
  token,
  invitationValid,
  tiersEmail,
  adresse,
}: {
  token: string | null;
  invitationValid: boolean;
  tiersEmail: string | null;
  adresse: string | null;
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
      siret: form.get("siret"),
      token,
    };

    try {
      const response = await fetch("/api/agence/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        claimed?: boolean;
      } | null;

      if (!response.ok) {
        setError(
          data?.error === "email_taken"
            ? "Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email."
            : data?.error === "siret_invalide"
              ? "Ce SIRET est invalide ou introuvable. Vérifiez le numéro saisi."
              : data?.error === "siret_indisponible"
                ? "Impossible de vérifier ce SIRET pour le moment. Réessayez dans quelques instants."
                : "Impossible de créer le compte. Réessayez.",
        );
        setSubmitting(false);
        return;
      }

      if (data?.claimed === false) {
        setError(
          "Compte créé, mais l'invitation n'a pas pu être validée. Connectez-vous pour réessayer.",
        );
        setSubmitting(false);
        return;
      }

      router.push("/agence/espace");
    } catch {
      setError("Impossible de créer le compte. Réessayez.");
      setSubmitting(false);
    }
  }

  if (!invitationValid) {
    return (
      <AuthCard title="Créer mon compte agence" action={<ThemeToggle />}>
        <Alert>Ce lien d&apos;invitation est invalide, expiré ou déjà utilisé.</Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Créer mon compte agence"
      action={<ThemeToggle />}
      footer={
        <>
          Vous avez déjà un compte agence ?{" "}
          <Link
            href={`/agence/connexion?token=${token}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Se connecter
          </Link>
        </>
      }
    >
      <p className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
        Vous avez été invité à consulter, en lecture seule, le carnet du logement situé au{" "}
        <strong>{adresse}</strong>.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" name="email" type="email" required readOnly value={tiersEmail ?? ""} />
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
        <Input
          label="SIRET"
          name="siret"
          type="text"
          required
          pattern="[0-9]{14}"
          title="14 chiffres"
        />
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" loading={submitting} className="w-full">
          Créer mon compte
        </Button>
      </form>
    </AuthCard>
  );
}
