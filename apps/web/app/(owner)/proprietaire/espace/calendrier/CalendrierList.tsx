"use client";

import { dateFormatter, montantFormatter } from "@/lib/formatters";
import { Fragment, useMemo, useState } from "react";
import { RendezVousForm } from "./RendezVousForm";
import { RendezVousRow, type RendezVous } from "./RendezVousRow";

interface Intervention {
  id: string;
  type_travaux: string;
  date_intervention: string;
  montant_euros: number;
}

interface Rappel {
  id: string;
  titre: string;
  date_echeance: string;
  traite_a: string | null;
}

type Kind = "intervention" | "rappel" | "rendez_vous";

const KIND_LABELS: Record<Kind, string> = {
  intervention: "Interventions",
  rappel: "Rappels",
  rendez_vous: "Rendez-vous",
};

export function CalendrierList({
  interventions,
  rappels,
  rendezVous,
  contacts,
}: {
  logementId: string;
  interventions: Intervention[];
  rappels: Rappel[];
  rendezVous: RendezVous[];
  contacts: { id: string; nom: string }[];
}) {
  const [activeKinds, setActiveKinds] = useState<Set<Kind>>(
    new Set(["intervention", "rappel", "rendez_vous"]),
  );

  function toggleKind(kind: Kind) {
    setActiveKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) {
        next.delete(kind);
      } else {
        next.add(kind);
      }
      return next;
    });
  }

  const items = useMemo(() => {
    const merged: { kind: Kind; id: string; date: string; render: () => React.ReactNode }[] = [];

    for (const intervention of interventions) {
      merged.push({
        kind: "intervention",
        id: intervention.id,
        date: intervention.date_intervention,
        render: () => (
          <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
            <span className="flex-1 font-medium text-foreground">
              {intervention.type_travaux}
            </span>
            <span className="text-muted-foreground">
              {dateFormatter.format(new Date(intervention.date_intervention))}
            </span>
            <span className="text-foreground">
              {montantFormatter.format(Number(intervention.montant_euros))}
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              Intervention
            </span>
          </li>
        ),
      });
    }

    for (const rappel of rappels) {
      const enRetard = !rappel.traite_a && new Date(rappel.date_echeance) < new Date();
      merged.push({
        kind: "rappel",
        id: rappel.id,
        date: rappel.date_echeance,
        render: () => (
          <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
            <span className="flex-1 font-medium text-foreground">{rappel.titre}</span>
            <span className="text-muted-foreground">
              {dateFormatter.format(new Date(rappel.date_echeance))}
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
              {rappel.traite_a ? "Traité" : enRetard ? "Rappel en retard" : "Rappel"}
            </span>
          </li>
        ),
      });
    }

    for (const rdv of rendezVous) {
      merged.push({
        kind: "rendez_vous",
        id: rdv.id,
        date: rdv.date_prevue,
        render: () => <RendezVousRow rendezVous={rdv} />,
      });
    }

    return merged
      .filter((item) => activeKinds.has(item.kind))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [interventions, rappels, rendezVous, activeKinds]);

  return (
    <div className="space-y-4">
      <RendezVousForm contacts={contacts} />

      <div className="flex flex-wrap gap-2">
        {(Object.keys(KIND_LABELS) as Kind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => toggleKind(kind)}
            className={
              activeKinds.has(kind)
                ? "rounded-full px-3 py-1 text-xs font-medium text-white shadow-sm"
                : "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
            }
            style={
              activeKinds.has(kind)
                ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }
                : undefined
            }
          >
            {KIND_LABELS[kind]}
          </button>
        ))}
      </div>

      {items.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {items.map((item) => (
            <Fragment key={`${item.kind}-${item.id}`}>{item.render()}</Fragment>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Rien à afficher pour l&apos;instant.</p>
      )}
    </div>
  );
}
