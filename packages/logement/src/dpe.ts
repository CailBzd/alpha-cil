const ADEME_DPE_ENDPOINT =
  "https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines";

interface AdemeDpeRecord {
  etiquette_dpe: string;
  etiquette_ges: string;
  adresse_ban: string;
  conso_5_usages_par_m2_ep?: number;
  emission_ges_5_usages_par_m2?: number;
  date_etablissement_dpe?: string;
  surface_habitable_logement?: number;
}

interface AdemeDpeResponse {
  results: AdemeDpeRecord[];
}

export interface DpeResult {
  classeEnergie: string;
  classeGes: string;
  consommation: number | null;
  emissions: number | null;
  dateDiagnostic: string | null;
  surfaceHabitable: number | null;
}

// Looks up the DPE (energy/GES classes) for an address via ADEME's open
// dataset of existing-housing diagnostics. Uses full-text search (no
// geocoding), which alone is too permissive: it returns a "best available"
// result even for a nonsense query, so the top match's address must share
// the input's postal code before it's trusted — otherwise treated as no
// DPE found. Any network failure or unexpected response is likewise
// treated as "not found" rather than blocking the caller (same resilient
// posture as verifyRge).
export async function lookupDpe(adresse: string): Promise<DpeResult | null> {
  try {
    const url = `${ADEME_DPE_ENDPOINT}?q=${encodeURIComponent(adresse)}&size=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as AdemeDpeResponse;
    const record = data.results[0];
    if (!record?.etiquette_dpe || !record?.etiquette_ges || !record?.adresse_ban) {
      return null;
    }
    const postalCode = adresse.match(/\b\d{5}\b/)?.[0];
    if (!postalCode || !record.adresse_ban.includes(postalCode)) {
      return null;
    }
    return {
      classeEnergie: record.etiquette_dpe,
      classeGes: record.etiquette_ges,
      consommation: record.conso_5_usages_par_m2_ep ?? null,
      emissions: record.emission_ges_5_usages_par_m2 ?? null,
      dateDiagnostic: record.date_etablissement_dpe ?? null,
      surfaceHabitable: record.surface_habitable_logement ?? null,
    };
  } catch {
    return null;
  }
}
