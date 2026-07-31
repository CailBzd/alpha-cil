const ADEME_RGE_ENDPOINT =
  "https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines";

interface AdemeRgeRecord {
  siret: string;
  lien_date_debut: string;
  lien_date_fin: string;
}

interface AdemeRgeResponse {
  results: AdemeRgeRecord[];
}

// Whether the given SIRET held an active RGE qualification covering
// dateIntervention (both "YYYY-MM-DD", compared lexicographically since
// ISO date strings sort chronologically). Never throws: a network failure
// or an unexpected response is treated as "not verified" rather than
// blocking the intervention submission that depends on this call.
export async function verifyRge(siret: string, dateIntervention: string): Promise<boolean> {
  try {
    const url = `${ADEME_RGE_ENDPOINT}?qs=siret:${encodeURIComponent(siret)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      return false;
    }
    const data = (await response.json()) as AdemeRgeResponse;
    return data.results.some(
      (record) =>
        record.lien_date_debut <= dateIntervention && dateIntervention <= record.lien_date_fin,
    );
  } catch {
    return false;
  }
}
