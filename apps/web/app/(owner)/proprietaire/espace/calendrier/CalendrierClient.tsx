"use client";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { useMemo, useRef, useState } from "react";
import { Calendar, dateFnsLocalizer, Views, type View } from "react-big-calendar";
import { CalendrierList } from "./CalendrierList";
import type { RendezVous } from "./RendezVousRow";

interface Intervention {
  id: string;
  type_travaux: string;
  date_intervention: string;
  montant_euros: number;
  duree_heures: number | null;
}

interface Rappel {
  id: string;
  titre: string;
  date_echeance: string;
  traite_a: string | null;
}

type Kind = "intervention" | "rappel" | "rendez_vous";

interface CalendarEvent {
  id: string;
  kind: Kind;
  title: string;
  start: Date;
  end: Date;
  allDay: true;
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { fr },
});

const KIND_STYLE: Record<Kind, { background: string; color: string }> = {
  intervention: { background: "var(--color-secondary)", color: "var(--color-secondary-foreground)" },
  rappel: { background: "var(--color-destructive)", color: "var(--color-destructive-foreground)" },
  rendez_vous: { background: "var(--color-primary)", color: "var(--color-primary-foreground)" },
};

const MESSAGES = {
  month: "Mois",
  week: "Semaine",
  today: "Aujourd'hui",
  previous: "Précédent",
  next: "Suivant",
  noEventsInRange: "Rien à afficher pour cette période.",
  showMore: (total: number) => `+ ${total} de plus`,
};

export function CalendrierClient({
  logementId,
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
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const events = useMemo<CalendarEvent[]>(
    () => [
      ...interventions.map((intervention) => ({
        id: intervention.id,
        kind: "intervention" as const,
        title: intervention.type_travaux,
        start: new Date(intervention.date_intervention),
        end: new Date(intervention.date_intervention),
        allDay: true as const,
      })),
      ...rappels.map((rappel) => ({
        id: rappel.id,
        kind: "rappel" as const,
        title: rappel.titre,
        start: new Date(rappel.date_echeance),
        end: new Date(rappel.date_echeance),
        allDay: true as const,
      })),
      ...rendezVous.map((rdv) => ({
        id: rdv.id,
        kind: "rendez_vous" as const,
        title: rdv.type_travaux,
        start: new Date(rdv.date_prevue),
        end: new Date(rdv.date_prevue),
        allDay: true as const,
      })),
    ],
    [interventions, rappels, rendezVous],
  );

  function handleSelectEvent(event: CalendarEvent) {
    if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
    const key = `${event.kind}-${event.id}`;
    setHighlightedId(key);
    document
      .getElementById(`entry-${key}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    highlightTimeout.current = setTimeout(() => setHighlightedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-2">
        <Calendar
          localizer={localizer}
          culture="fr"
          events={events}
          date={date}
          onNavigate={setDate}
          view={view}
          onView={setView}
          views={[Views.MONTH, Views.WEEK]}
          style={{ height: 560 }}
          popup
          onSelectEvent={handleSelectEvent}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: KIND_STYLE[(event as CalendarEvent).kind].background,
              color: KIND_STYLE[(event as CalendarEvent).kind].color,
            },
          })}
          messages={MESSAGES}
        />
      </div>

      <CalendrierList
        logementId={logementId}
        interventions={interventions}
        rappels={rappels}
        rendezVous={rendezVous}
        contacts={contacts}
        highlightedId={highlightedId}
      />
    </div>
  );
}
