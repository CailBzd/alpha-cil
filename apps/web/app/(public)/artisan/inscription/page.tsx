"use client";

import { Alert, AuthCard, Button, Input, PasswordInput, Select } from "@alpha-cil/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CORPS_METIER_OPTIONS } from "@/lib/corps-metier";
import { ThemeToggle } from "../../../theme-toggle";

export default function ArtisanInscriptionPage() {
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
      corpsMetier: form.get("corpsMetier"),
    };

    try {
      const response = await fetch("/api/artisan/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
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

      router.push("/artisan/espace");
    } catch {
      setError("Impossible de créer le compte. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Créer mon compte artisan"
      action={<ThemeToggle />}
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/artisan/connexion" className="font-medium text-foreground underline underline-offset-4">
            Se connecter
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
        <Select
          label="Corps de métier"
          name="corpsMetier"
          required
          defaultValue=""
          placeholder="Sélectionnez un corps de métier"
          options={CORPS_METIER_OPTIONS.map((option) => ({ ...option }))}
        />
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" loading={submitting} className="w-full">
          Créer mon compte
        </Button>
      </form>
    </AuthCard>
  );
}
