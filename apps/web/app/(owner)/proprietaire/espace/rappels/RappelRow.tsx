"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, Button, Input, Select } from "@alpha-cil/ui";
import { dateFormatter } from "@/lib/formatters";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface Rappel {
  id: string;
  titre: string;
  date_echeance: string;
  contact_id: string | null;
  notes: string | null;
  traite_a: string | null;
}

interface ContactOption {
  id: string;
  nom: string;
  telephone?: string | null;
}

export function RappelRow({
  rappel,
  contact,
  contacts,
}: {
  rappel: Rappel;
  contact: ContactOption | null;
  contacts: ContactOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"save" | "toggle" | "delete" | null>(null);

  const enRetard = !rappel.traite_a && new Date(rappel.date_echeance) < new Date();

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoadingAction("save");

    const form = new FormData(event.currentTarget);
    const contactId = form.get("contactId");
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from("rappels")
      .update({
        titre: form.get("titre"),
        date_echeance: form.get("dateEcheance"),
        contact_id: contactId || null,
        notes: form.get("notes") || null,
      })
      .eq("id", rappel.id);

    if (updateError) {
      setError("Impossible d'enregistrer ces modifications. Réessayez.");
      setLoadingAction(null);
      return;
    }

    setEditing(false);
    setLoadingAction(null);
    router.refresh();
  }

  async function toggleTraite() {
    setError(null);
    setLoadingAction("toggle");
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from("rappels")
      .update({ traite_a: rappel.traite_a ? null : new Date().toISOString() })
      .eq("id", rappel.id);

    if (updateError) {
      setError("Impossible de mettre à jour ce rappel. Réessayez.");
      setLoadingAction(null);
      return;
    }

    setLoadingAction(null);
    router.refresh();
  }

  async function handleDelete() {
    setError(null);
    setLoadingAction("delete");
    const supabase = createBrowserSupabaseClient();
    const { error: deleteError } = await supabase.from("rappels").delete().eq("id", rappel.id);

    if (deleteError) {
      setError("Impossible de supprimer ce rappel. Réessayez.");
      setLoadingAction(null);
      return;
    }

    router.refresh();
  }

  if (editing) {
    return (
      <li className="p-4">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Titre" name="titre" type="text" defaultValue={rappel.titre} required />
          <Input
            label="Échéance"
            name="dateEcheance"
            type="date"
            defaultValue={rappel.date_echeance}
            required
          />
          <Select
            label="Contact lié"
            name="contactId"
            defaultValue={rappel.contact_id ?? ""}
            placeholder="Aucun"
            options={contacts.map((c) => ({ value: c.id, label: c.nom }))}
          />
          <Input label="Notes" name="notes" type="text" defaultValue={rappel.notes ?? ""} />
          {error ? <Alert>{error}</Alert> : null}
          <div className="flex gap-3">
            <Button type="submit" loading={loadingAction === "save"} className="flex-1">
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loadingAction === "save"}
              onClick={() => setEditing(false)}
              className="flex-1"
            >
              Annuler
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
      <span className="flex-1 font-medium text-foreground">{rappel.titre}</span>
      <span className="text-muted-foreground">
        {dateFormatter.format(new Date(rappel.date_echeance))}
      </span>
      <span className="text-muted-foreground">
        {contact ? `${contact.nom}${contact.telephone ? ` (${contact.telephone})` : ""}` : "Aucun contact lié"}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          rappel.traite_a
            ? "bg-secondary text-secondary-foreground"
            : enRetard
              ? "border border-destructive/30 bg-destructive/10 text-destructive"
              : "border border-border text-muted-foreground"
        }`}
      >
        {rappel.traite_a
          ? `Traité le ${dateFormatter.format(new Date(rappel.traite_a))}`
          : enRetard
            ? "En retard"
            : "À faire"}
      </span>
      {rappel.notes ? (
        <span className="w-full text-xs text-muted-foreground">{rappel.notes}</span>
      ) : null}
      {error ? <Alert>{error}</Alert> : null}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={loadingAction === "delete"}
          loading={loadingAction === "toggle"}
          onClick={toggleTraite}
        >
          {rappel.traite_a ? "Marquer à faire" : "Marquer traité"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={loadingAction !== null}
          onClick={() => setEditing(true)}
        >
          Modifier
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={loadingAction === "toggle"}
          loading={loadingAction === "delete"}
          onClick={handleDelete}
        >
          Supprimer
        </Button>
      </div>
    </li>
  );
}
