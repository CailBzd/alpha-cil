// Lives here (alongside ademe.ts) as "external gov API lookup," the same
// category as the RGE check below — not because SIRET verification is
// intervention-specific. It's shared by both the artisan and the agence
// signup routes.
const RECHERCHE_ENTREPRISES_ENDPOINT = "https://recherche-entreprises.api.gouv.fr/search";

interface EtablissementMatch {
  siret: string;
  etat_administratif: string;
}

interface RechercheEntreprisesResult {
  nom_complet?: string;
  nom_raison_sociale?: string;
  matching_etablissements?: EtablissementMatch[];
}

interface RechercheEntreprisesResponse {
  results: RechercheEntreprisesResult[];
}

export type VerifySiretResult =
  | { status: "valide"; denomination: string }
  | { status: "introuvable" | "indisponible" };

// Verifies a SIRET against the free, keyless recherche-entreprises.api.gouv.fr
// registry (the government's replacement for the old token-based INSEE
// Sirene API). Unlike verifyRge below, this is meant to BLOCK account
// creation on the caller's side — so unlike verifyRge it distinguishes a
// confirmed bad SIRET ("introuvable") from the lookup service itself being
// unreachable ("indisponible"), so the caller can show an honest message
// instead of falsely telling a legitimate business their SIRET is wrong.
export async function verifySiret(siret: string): Promise<VerifySiretResult> {
  try {
    const url = `${RECHERCHE_ENTREPRISES_ENDPOINT}?q=${encodeURIComponent(siret)}&per_page=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      return { status: "indisponible" };
    }

    const data = (await response.json()) as RechercheEntreprisesResponse;
    const result = data.results[0];
    const etablissement = result?.matching_etablissements?.find(
      (candidate) => candidate.siret === siret,
    );

    if (!etablissement || etablissement.etat_administratif !== "A") {
      return { status: "introuvable" };
    }

    return {
      status: "valide",
      denomination: result.nom_complet ?? result.nom_raison_sociale ?? siret,
    };
  } catch {
    return { status: "indisponible" };
  }
}
