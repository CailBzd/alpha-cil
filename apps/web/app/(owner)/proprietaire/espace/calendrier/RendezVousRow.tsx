"use client";

import { Alert, Button, Input } from "@alpha-cil/ui";
import { dateFormatter } from "@/lib/formatters";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export interface RendezVous {
  id: string;
  type_travaux: string;
  date_prevue: string;
  statut: "provisoire" | "validee";
  artisan_id: string | null;
  artisan_email: string | null;
  notes: string | null;
  contact_id: string | null;
}

export function RendezVousRow({
  rendezVous,
  highlighted,
}: {
  rendezVous: RendezVous;
  highlighted?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"save" | "toggle" | "delete" | null>(null);

  async function patch(body: Record<string, unknown>, action: "save" | "toggle") {
    setLoadingAction(action);
    setError(null);
    const response = await fetch(`/api/rendez-vous/${rendezVous.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      setError("Impossible d'enregistrer cette modification. Réessayez.");
      setLoadingAction(null);
      return false;
    }
    setLoadingAction(null);
    return true;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await patch(
      {
        datePrevue: form.get("datePrevue"),
        notes: form.get("notes") || "",
      },
      "save",
    );
    if (ok) {
      setEditing(false);
      router.refresh();
    }
  }

  async function toggleStatut() {
    const ok = await patch(
      { statut: rendezVous.statut === "validee" ? "provisoire" : "validee" },
      "toggle",
    );
    if (ok) router.refresh();
  }

  async function handleDelete() {
    setLoadingAction("delete");
    setError(null);
    const response = await fetch(`/api/rendez-vous/${rendezVous.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Impossible de supprimer ce rendez-vous. Réessayez.");
      setLoadingAction(null);
      return;
    }
    router.refresh();
  }

  if (editing) {
    return (
      <li id={`entry-rendez_vous-${rendezVous.id}`} className="p-4">
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Date prévue"
            name="datePrevue"
            type="date"
            defaultValue={rendezVous.date_prevue}
            required
          />
          <Input label="Notes" name="notes" type="text" defaultValue={rendezVous.notes ?? ""} />
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
    <li
      id={`entry-rendez_vous-${rendezVous.id}`}
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm transition-colors ${
        highlighted ? "bg-secondary" : ""
      }`}
    >
      <span className="flex-1 font-medium text-foreground">{rendezVous.type_travaux}</span>
      <span className="text-muted-foreground">
        {dateFormatter.format(new Date(rendezVous.date_prevue))}
      </span>
      <span className="text-muted-foreground">
        {rendezVous.artisan_id
          ? "Artisan lié"
          : rendezVous.artisan_email
            ? "En attente de compte artisan"
            : "Aucun artisan lié"}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          rendezVous.statut === "validee"
            ? "bg-secondary text-secondary-foreground"
            : "border border-border text-muted-foreground"
        }`}
      >
        {rendezVous.statut === "validee" ? "Validée" : "Provisoire"}
      </span>
      {rendezVous.notes ? (
        <span className="w-full text-xs text-muted-foreground">{rendezVous.notes}</span>
      ) : null}
      {error ? <Alert>{error}</Alert> : null}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={loadingAction === "delete"}
          loading={loadingAction === "toggle"}
          onClick={toggleStatut}
        >
          {rendezVous.statut === "validee" ? "Marquer provisoire" : "Marquer validée"}
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
