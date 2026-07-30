"use client";

import { Alert, Button, Input } from "@alpha-cil/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });

interface RendezVous {
  id: string;
  type_travaux: string;
  date_prevue: string;
  statut: "provisoire" | "validee";
  adresse: string | null;
  notes: string | null;
}

export function ArtisanRendezVousRow({ rendezVous }: { rendezVous: RendezVous }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);
    const response = await fetch(`/api/rendez-vous/${rendezVous.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      setError("Impossible d'enregistrer cette modification. Réessayez.");
      setSubmitting(false);
      return false;
    }
    setSubmitting(false);
    return true;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await patch({ datePrevue: form.get("datePrevue") });
    if (ok) {
      setEditing(false);
      router.refresh();
    }
  }

  async function toggleStatut() {
    const ok = await patch({ statut: rendezVous.statut === "validee" ? "provisoire" : "validee" });
    if (ok) router.refresh();
  }

  if (editing) {
    return (
      <li className="p-4">
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Date prévue"
            name="datePrevue"
            type="date"
            defaultValue={rendezVous.date_prevue}
            required
          />
          {error ? <Alert>{error}</Alert> : null}
          <div className="flex gap-3">
            <Button type="submit" loading={submitting} className="flex-1">
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
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
      <span className="flex-1 font-medium text-foreground">{rendezVous.type_travaux}</span>
      <span className="text-muted-foreground">{rendezVous.adresse ?? "Adresse inconnue"}</span>
      <span className="text-muted-foreground">
        {dateFormatter.format(new Date(rendezVous.date_prevue))}
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
        <Button variant="outline" size="sm" loading={submitting} onClick={toggleStatut}>
          {rendezVous.statut === "validee" ? "Marquer provisoire" : "Marquer validée"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={submitting}
          onClick={() => setEditing(true)}
        >
          Modifier la date
        </Button>
      </div>
    </li>
  );
}
