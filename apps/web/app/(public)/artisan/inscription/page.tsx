"use client";

import { Alert, AuthCard, Button, Input, Select } from "@alpha-cil/ui";
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
    const body = {
      email: form.get("email"),
      password: form.get("password"),
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
        <Input
          label="Mot de passe"
          name="password"
          type="password"
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
        <Button type="submit" disabled={submitting} className="w-full">
          Créer mon compte
        </Button>
      </form>
    </AuthCard>
  );
}
