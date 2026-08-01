const MISTRAL_CHAT_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export interface DevisPourComparaison {
  contact: string;
  montant: number | null;
  conditions: string | null;
  statut: string;
  dateDevis: string | null;
}

interface MistralChatResponse {
  choices?: { message?: { content?: string } }[];
}

// Paid keyed API — unlike the free/keyless gov lookups in packages/
// intervention and packages/logement (which swallow every error and
// return a benign fallback), this mirrors packages/notifications/src/
// mailer.ts's posture: throw on a missing key or a failed call, and let
// the caller (a Route Handler, in the foreground of a user action) decide
// the user-facing error. A failed AI call here is a real failure, not a
// background enrichment that should silently degrade.
export async function compareDevis(devisList: DevisPourComparaison[]): Promise<string> {
  if (devisList.length === 0) {
    throw new Error("compareDevis requires at least one devis");
  }

  const apiKey = requireEnv("MISTRAL_API_KEY");

  const devisDescription = devisList
    .map(
      (devis, index) =>
        `Devis ${index + 1} — prestataire : ${devis.contact} ; montant : ${
          devis.montant !== null ? `${devis.montant} €` : "non renseigné"
        } ; statut : ${devis.statut} ; date : ${devis.dateDevis ?? "non renseignée"} ; conditions : ${
          devis.conditions ?? "non renseignées"
        }`,
    )
    .join("\n");

  const response = await fetch(MISTRAL_CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant qui compare des devis de travaux pour un propriétaire français. Sois factuel et concis, souligne les écarts de prix et de conditions ainsi que les points de vigilance. Ne donne jamais de conseil juridique ou financier engageant : reste informatif, l'utilisateur garde la décision finale.",
        },
        {
          role: "user",
          content: `Compare les devis suivants et propose une synthèse utile pour aider à choisir :\n\n${devisDescription}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Mistral request failed with status ${response.status}`);
  }

  const data = (await response.json()) as MistralChatResponse;
  const contenu = data.choices?.[0]?.message?.content;

  if (!contenu) {
    throw new Error("Mistral response contained no content");
  }

  return contenu;
}
