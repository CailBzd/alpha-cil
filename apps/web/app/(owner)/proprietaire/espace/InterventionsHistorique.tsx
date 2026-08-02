import { dateFormatter, dateTimeFormatter, montantFormatter } from "@/lib/formatters";
import { AttestationLink } from "./AttestationLink";

interface Intervention {
  id: string;
  type_travaux: string;
  date_intervention: string;
  montant_euros: number;
  duree_heures: number | null;
  artisan_id: string | null;
  artisan_siret: string | null;
  rge_verifie: boolean;
  rge_verifie_a: string | null;
  attestation_decennale_path: string | null;
  attestation_decennale_uploaded_at: string | null;
}

const dureeFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

function groupByYear(interventions: Intervention[]) {
  const groups = new Map<number, Intervention[]>();
  for (const intervention of interventions) {
    const year = new Date(intervention.date_intervention).getUTCFullYear();
    const group = groups.get(year);
    if (group) {
      group.push(intervention);
    } else {
      groups.set(year, [intervention]);
    }
  }
  return [...groups.entries()].sort((a, b) => b[0] - a[0]);
}

export function InterventionsHistorique({ interventions }: { interventions: Intervention[] }) {
  if (interventions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune intervention enregistrée pour ce logement pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {groupByYear(interventions).map(([year, group]) => (
        <div key={year} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{year}</h3>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {group.map((intervention) => (
              <li key={intervention.id} className="space-y-2 px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-base font-semibold text-foreground">
                    {intervention.type_travaux}
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {montantFormatter.format(Number(intervention.montant_euros))}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{dateFormatter.format(new Date(intervention.date_intervention))}</span>
                  {intervention.duree_heures ? (
                    <span>· {dureeFormatter.format(intervention.duree_heures)} h</span>
                  ) : null}
                  {intervention.artisan_id === null ? (
                    <span className="rounded-full border border-border px-2 py-0.5">
                      Saisie par vous
                    </span>
                  ) : (
                    <>
                      <span>· Artisan (SIRET {intervention.artisan_siret ?? "inconnu"})</span>
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          intervention.rge_verifie
                            ? "bg-secondary text-secondary-foreground"
                            : "border border-border"
                        }`}
                      >
                        {intervention.rge_verifie ? "RGE vérifié" : "RGE non vérifié"}
                        {intervention.rge_verifie_a
                          ? ` le ${dateTimeFormatter.format(new Date(intervention.rge_verifie_a))}`
                          : ""}
                      </span>
                    </>
                  )}
                </div>
                {intervention.artisan_id !== null ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {intervention.attestation_decennale_path ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1 text-xs text-foreground">
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3.5 w-3.5 text-muted-foreground"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.75 2.5a.75.75 0 00-1.5 0v10.638L5.29 11.177a.75.75 0 10-1.08 1.04l3.25 3.5a.75.75 0 001.08 0l3.25-3.5a.75.75 0 10-1.08-1.04l-1.96 2.11V2.5z"
                            clipRule="evenodd"
                          />
                          <path d="M3.5 15.5a.75.75 0 01.75-.75h11.5a.75.75 0 010 1.5H4.25a.75.75 0 01-.75-.75z" />
                        </svg>
                        <AttestationLink path={intervention.attestation_decennale_path} />
                        {intervention.attestation_decennale_uploaded_at
                          ? ` (${dateFormatter.format(new Date(intervention.attestation_decennale_uploaded_at))})`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Attestation décennale : aucune fournie (déclarative, non vérifiée par une
                        source tierce).
                      </span>
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
