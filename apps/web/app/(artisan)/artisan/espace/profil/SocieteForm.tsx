"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, Button, Input } from "@alpha-cil/ui";
import { CORPS_METIER_OPTIONS } from "@/lib/corps-metier";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function SocieteForm({
  artisanId,
  siret,
  denomination,
  adresse,
  telephone,
  corpsMetier,
}: {
  artisanId: string;
  siret: string;
  denomination: string | null;
  adresse: string | null;
  telephone: string | null;
  corpsMetier: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const corpsMetiers = form.getAll("corpsMetier") as string[];

    if (corpsMetiers.length === 0) {
      setError("Sélectionnez au moins un corps de métier.");
      return;
    }

    setSubmitting(true);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from("artisans")
      .update({
        denomination: form.get("denomination") || null,
        adresse: form.get("adresse") || null,
        telephone: form.get("telephone") || null,
        corps_metier: corpsMetiers,
      })
      .eq("id", artisanId);

    if (updateError) {
      setError("Impossible d'enregistrer ces informations. Réessayez.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <Input label="SIRET" value={siret} disabled />
      <Input label="Nom de la société" name="denomination" type="text" defaultValue={denomination ?? ""} />
      <Input label="Adresse" name="adresse" type="text" defaultValue={adresse ?? ""} />
      <Input label="Téléphone" name="telephone" type="tel" defaultValue={telephone ?? ""} />
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-foreground">Corps de métier</span>
        <div className="space-y-1">
          {CORPS_METIER_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                name="corpsMetier"
                value={option.value}
                defaultChecked={corpsMetier.includes(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" loading={submitting} className="w-full">
        Enregistrer
      </Button>
    </form>
  );
}
