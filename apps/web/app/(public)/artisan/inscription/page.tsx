"use client";

import { Button, Input } from "@alpha-cil/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const CORPS_METIER_OPTIONS = [
  { value: "plombier", label: "Plombier" },
  { value: "electricien", label: "Électricien" },
  { value: "chauffagiste", label: "Chauffagiste" },
  { value: "couvreur", label: "Couvreur" },
  { value: "macon", label: "Maçon" },
  { value: "menuisier", label: "Menuisier" },
  { value: "peintre", label: "Peintre" },
  { value: "carreleur", label: "Carreleur" },
  { value: "autre", label: "Autre" },
] as const;

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
    <main>
      <h1>Alpha CIL</h1>
      <form onSubmit={handleSubmit}>
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
        <div>
          <label htmlFor="corpsMetier">Corps de métier</label>
          <select id="corpsMetier" name="corpsMetier" required defaultValue="">
            <option value="" disabled>
              Sélectionnez un corps de métier
            </option>
            {CORPS_METIER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={submitting}>
          Créer mon compte
        </Button>
        {error ? <p role="alert">{error}</p> : null}
      </form>
      <p>
        Déjà un compte ? <Link href="/artisan/connexion">Se connecter</Link>
      </p>
    </main>
  );
}
