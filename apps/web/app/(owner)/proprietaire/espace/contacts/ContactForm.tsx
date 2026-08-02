"use client";

import { createBrowserSupabaseClient } from "@foya/db";
import { Alert, Button, Input, Select } from "@foya/ui";
import { CORPS_METIER_OPTIONS } from "@/lib/corps-metier";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const SIRET_LOOKUP_ERROR_MESSAGES: Record<string, string> = {
  siret_invalide: "Ce SIRET est invalide ou introuvable.",
  siret_indisponible: "Impossible de vérifier ce SIRET pour le moment. Réessayez.",
};

export function ContactForm() {
  const router = useRouter();
  const [siret, setSiret] = useState("");
  const [nom, setNom] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLookupSiret() {
    setLookupError(null);
    setLookingUp(true);

    try {
      const response = await fetch("/api/proprietaire/contacts/siret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siret }),
      });

      const data = (await response.json().catch(() => null)) as
        | { denomination?: string; error?: string }
        | null;

      if (!response.ok) {
        setLookupError(
          (data?.error && SIRET_LOOKUP_ERROR_MESSAGES[data.error]) ??
            "Impossible de vérifier ce SIRET pour le moment. Réessayez.",
        );
        setLookingUp(false);
        return;
      }

      if (data?.denomination) {
        setNom(data.denomination);
      }
      setLookingUp(false);
    } catch {
      setLookupError("Impossible de vérifier ce SIRET pour le moment. Réessayez.");
      setLookingUp(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const corpsMetier = form.get("corpsMetier");
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Session expirée. Reconnectez-vous.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("contacts").insert({
      proprietaire_id: user.id,
      nom,
      siret: siret || null,
      alias: form.get("alias") || null,
      corps_metier: corpsMetier || null,
      telephone: form.get("telephone") || null,
      email: form.get("email") || null,
      interlocuteur_prenom: form.get("interlocuteurPrenom") || null,
      interlocuteur_nom: form.get("interlocuteurNom") || null,
      notes: form.get("notes") || null,
    });

    if (insertError) {
      setError("Impossible d'enregistrer ce contact. Réessayez.");
      setSubmitting(false);
      return;
    }

    (event.target as HTMLFormElement).reset();
    setSiret("");
    setNom("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-foreground">Ajouter un contact</h2>
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="SIRET (optionnel, si c'est une entreprise)"
          name="siret"
          type="text"
          pattern="[0-9]{14}"
          title="14 chiffres"
          value={siret}
          onChange={(event) => setSiret(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          loading={lookingUp}
          disabled={siret.trim().length === 0}
          onClick={handleLookupSiret}
        >
          Rechercher
        </Button>
      </div>
      {lookupError ? <Alert>{lookupError}</Alert> : null}
      <Input
        label="Nom"
        name="nom"
        type="text"
        required
        value={nom}
        onChange={(event) => setNom(event.target.value)}
      />
      <Input label="Alias (optionnel)" name="alias" type="text" />
      <Select
        label="Corps de métier"
        name="corpsMetier"
        defaultValue=""
        placeholder="Non renseigné"
        options={CORPS_METIER_OPTIONS.map((option) => ({ ...option }))}
      />
      <Input label="Téléphone" name="telephone" type="tel" />
      <Input label="Email" name="email" type="email" />
      <Input label="Prénom de l'interlocuteur (optionnel)" name="interlocuteurPrenom" type="text" />
      <Input label="Nom de l'interlocuteur (optionnel)" name="interlocuteurNom" type="text" />
      <Input label="Notes" name="notes" type="text" />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" loading={submitting} className="w-full">
        Ajouter
      </Button>
    </form>
  );
}
