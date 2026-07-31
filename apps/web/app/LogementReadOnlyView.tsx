import { chauffageLabel, vmcLabel } from "@/lib/equipements";
import { dateFormatter, dateTimeFormatter } from "@/lib/formatters";

export interface ReadOnlyIntervention {
  id: string;
  type_travaux: string;
  date_intervention: string;
  artisan_siret: string | null;
  rge_verifie: boolean;
  rge_verifie_a: string | null;
}

// Shared between the anonymous /consultation?token=... link and the
// authenticated agency dashboard, so both read-only surfaces show exactly
// the same thing and can't quietly drift apart on what "read-only" means
// (e.g. the showDetails gate on adresse/équipements, mirroring
// validate_access_grant's own scope==='total' condition).
export function LogementReadOnlyView({
  adresse,
  chauffageType,
  vmcType,
  showDetails,
  interventions,
}: {
  adresse: string | null;
  chauffageType: string[] | null;
  vmcType: string | null;
  showDetails: boolean;
  interventions: ReadOnlyIntervention[];
}) {
  return (
    <div className="space-y-4">
      {showDetails ? (
        <div className="space-y-1 text-sm">
          <p className="text-foreground">{adresse}</p>
          <p className="text-muted-foreground">
            Chauffage :{" "}
            {chauffageType && chauffageType.length > 0
              ? chauffageType.map(chauffageLabel).join(", ")
              : "Non renseigné"}
          </p>
          <p className="text-muted-foreground">VMC : {vmcType ? vmcLabel(vmcType) : "Non renseigné"}</p>
        </div>
      ) : null}

      <h1 className="text-lg font-semibold tracking-tight text-foreground">Interventions</h1>
      {interventions.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {interventions.map((intervention) => (
            <li
              key={intervention.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
            >
              <span className="text-muted-foreground">
                {dateFormatter.format(new Date(intervention.date_intervention))}
              </span>
              <span className="flex-1 font-medium text-foreground">{intervention.type_travaux}</span>
              <span className="text-muted-foreground">
                Artisan (SIRET {intervention.artisan_siret ?? "inconnu"})
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  intervention.rge_verifie
                    ? "bg-secondary text-secondary-foreground"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {intervention.rge_verifie ? "RGE vérifié" : "RGE non vérifié"}
                {intervention.rge_verifie_a
                  ? ` le ${dateTimeFormatter.format(new Date(intervention.rge_verifie_a))}`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Aucune intervention à afficher.</p>
      )}
    </div>
  );
}
