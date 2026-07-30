"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Alert, Button, Input, Select } from "@alpha-cil/ui";
import { CORPS_METIER_OPTIONS, corpsMetierLabel } from "@/lib/corps-metier";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export interface Contact {
  id: string;
  nom: string;
  corps_metier: string | null;
  telephone: string | null;
  email: string | null;
  notes: string | null;
}

export function ContactRow({ contact }: { contact: Contact }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"save" | "delete" | null>(null);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoadingAction("save");

    const form = new FormData(event.currentTarget);
    const corpsMetier = form.get("corpsMetier");
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        nom: form.get("nom"),
        corps_metier: corpsMetier || null,
        telephone: form.get("telephone") || null,
        email: form.get("email") || null,
        notes: form.get("notes") || null,
      })
      .eq("id", contact.id);

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
    setLoadingAction("delete");
    const supabase = createBrowserSupabaseClient();
    await supabase.from("contacts").delete().eq("id", contact.id);
    router.refresh();
  }

  if (editing) {
    return (
      <li className="p-4">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nom" name="nom" type="text" defaultValue={contact.nom} required />
          <Select
            label="Corps de métier"
            name="corpsMetier"
            defaultValue={contact.corps_metier ?? ""}
            placeholder="Non renseigné"
            options={CORPS_METIER_OPTIONS.map((option) => ({ ...option }))}
          />
          <Input label="Téléphone" name="telephone" type="tel" defaultValue={contact.telephone ?? ""} />
          <Input label="Email" name="email" type="email" defaultValue={contact.email ?? ""} />
          <Input label="Notes" name="notes" type="text" defaultValue={contact.notes ?? ""} />
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
      <span className="flex-1 font-medium text-foreground">{contact.nom}</span>
      <span className="text-muted-foreground">{corpsMetierLabel(contact.corps_metier)}</span>
      <span className="text-muted-foreground">{contact.telephone ?? "—"}</span>
      <span className="text-muted-foreground">{contact.email ?? "—"}</span>
      {contact.notes ? (
        <span className="w-full text-xs text-muted-foreground">{contact.notes}</span>
      ) : null}
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
