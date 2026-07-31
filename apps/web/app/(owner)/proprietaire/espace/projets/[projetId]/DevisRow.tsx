"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, Button, Input, Select } from "@alpha-cil/ui";
import { DEVIS_STATUT_OPTIONS, devisStatutLabel } from "@/lib/devis";
import { dateFormatter, montantFormatter } from "@/lib/formatters";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface Devis {
  id: string;
  contact_id: string;
  montant: number | null;
  conditions: string | null;
  statut: string;
  date_devis: string | null;
}

interface ContactOption {
  id: string;
  nom: string;
  telephone?: string | null;
}

export function DevisRow({
  devis,
  contact,
  contacts,
}: {
  devis: Devis;
  contact: ContactOption | null;
  contacts: ContactOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"save" | "delete" | null>(null);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoadingAction("save");

    const form = new FormData(event.currentTarget);
    const montant = form.get("montant");
    const dateDevis = form.get("dateDevis");
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from("devis")
      .update({
        contact_id: form.get("contactId"),
        montant: montant ? Number(montant) : null,
        conditions: form.get("conditions") || null,
        statut: form.get("statut"),
        date_devis: dateDevis || null,
      })
      .eq("id", devis.id);

    if (updateError) {
      setError("Impossible d'enregistrer ces modifications. Réessayez.");
      setLoadingAction(null);
      return;
    }

    setEditing(false);
    setLoadingAction(null);
    router.refresh();
  }

  async function handleDelete() {
    setError(null);
    setLoadingAction("delete");
    const supabase = createBrowserSupabaseClient();
    const { error: deleteError } = await supabase.from("devis").delete().eq("id", devis.id);

    if (deleteError) {
      setError("Impossible de supprimer ce devis. Réessayez.");
      setLoadingAction(null);
      return;
    }

    router.refresh();
  }

  if (editing) {
    return (
      <li className="p-4">
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            label="Contact"
            name="contactId"
            required
            defaultValue={devis.contact_id}
            options={contacts.map((c) => ({ value: c.id, label: c.nom }))}
          />
          <Select
            label="Statut"
            name="statut"
            required
            defaultValue={devis.statut}
            options={DEVIS_STATUT_OPTIONS.map((option) => ({ ...option }))}
          />
          <Input
            label="Montant (€, optionnel)"
            name="montant"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={devis.montant ?? ""}
          />
          <Input
            label="Date du devis (optionnel)"
            name="dateDevis"
            type="date"
            defaultValue={devis.date_devis ?? ""}
          />
          <Input
            label="Conditions (optionnel)"
            name="conditions"
            type="text"
            defaultValue={devis.conditions ?? ""}
          />
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
      <span className="flex-1 font-medium text-foreground">
        {contact?.nom ?? "Contact inconnu"}
      </span>
      <span className="text-foreground">
        {devis.montant ? montantFormatter.format(devis.montant) : "Montant non renseigné"}
      </span>
      <span className="text-muted-foreground">
        {devis.date_devis ? dateFormatter.format(new Date(devis.date_devis)) : "—"}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          devis.statut === "accepte"
            ? "bg-secondary text-secondary-foreground"
            : devis.statut === "refuse"
              ? "border border-destructive/30 bg-destructive/10 text-destructive"
              : "border border-border text-muted-foreground"
        }`}
      >
        {devisStatutLabel(devis.statut)}
      </span>
      {devis.conditions ? (
        <span className="w-full text-xs text-muted-foreground">{devis.conditions}</span>
      ) : null}
      {error ? <Alert>{error}</Alert> : null}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={loadingAction === "delete"}
          onClick={() => setEditing(true)}
        >
          Modifier
        </Button>
        <Button
          variant="outline"
          size="sm"
          loading={loadingAction === "delete"}
          onClick={handleDelete}
        >
          Supprimer
        </Button>
      </div>
    </li>
  );
}
