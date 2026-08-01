import { getServerSupabaseClient } from "@/lib/supabase-server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/supabase-server", () => ({ getServerSupabaseClient: vi.fn() }));

const LOGEMENT = {
  id: "logement-1",
  adresse: "1 rue de Test",
  type_operation: "renovation",
  chauffage_type: ["gaz"],
  vmc_type: "simple_flux",
  dpe_classe_energie: "C",
  dpe_classe_ges: "B",
  dpe_consommation: 150,
  dpe_emissions: 20,
  dpe_date_diagnostic: "2025-01-01",
  surface_habitable: 80,
  nombre_pieces: 4,
  annee_construction: 1990,
  derniere_verif_chauffage_gaz: "2026-01-01",
  attestation_entretien_chauffage_gaz_uploaded_at: "2026-01-02T00:00:00.000Z",
  derniere_verif_chauffage_bois: null,
  attestation_entretien_chauffage_bois_uploaded_at: null,
  derniere_verif_vmc: null,
  attestation_entretien_vmc_uploaded_at: null,
};

function fakeSupabase(opts: {
  authenticated?: boolean;
  logement?: typeof LOGEMENT | null;
  interventions?: unknown[];
}) {
  const authenticated = opts.authenticated ?? true;
  const logement = opts.logement === undefined ? LOGEMENT : opts.logement;
  const interventions = opts.interventions ?? [];

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authenticated ? { id: "user-1" } : null },
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "logements") {
        return { select: () => ({ maybeSingle: async () => ({ data: logement }) }) };
      }
      if (table === "interventions") {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({
                order: async () => ({ data: interventions }),
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/proprietaire/export/json", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/proprietaire/export/json", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an empty selection that isn't explicitly confirmed", async () => {
    vi.mocked(getServerSupabaseClient).mockResolvedValue(fakeSupabase({}) as never);

    const response = await POST(request({ interventionIds: [], includeAdresse: false }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "empty_selection" });
  });

  it("rejects an unauthenticated caller", async () => {
    vi.mocked(getServerSupabaseClient).mockResolvedValue(
      fakeSupabase({ authenticated: false }) as never,
    );

    const response = await POST(request({ includeAdresse: true }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
  });

  it("rejects a caller with no logement", async () => {
    vi.mocked(getServerSupabaseClient).mockResolvedValue(
      fakeSupabase({ logement: null }) as never,
    );

    const response = await POST(request({ includeAdresse: true }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "no_logement" });
  });

  it("returns a versioned JSON payload including the CIL fields, omitting the address when not selected", async () => {
    vi.mocked(getServerSupabaseClient).mockResolvedValue(fakeSupabase({}) as never);

    const response = await POST(request({ includeAdresse: false, confirmed: true }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Content-Disposition")).toContain("carnet-alpha-cil.json");

    const payload = await response.json();
    expect(payload.schemaVersion).toBe(1);
    expect(payload.logement.adresse).toBeNull();
    expect(payload.logement.typeOperation).toBe("renovation");
    expect(payload.logement.entretien.chauffageGaz.justificatifEnregistreLe).toBe(
      "2026-01-02T00:00:00.000Z",
    );
    expect(payload.interventions).toEqual([]);
  });

  it("includes the address when selected", async () => {
    vi.mocked(getServerSupabaseClient).mockResolvedValue(fakeSupabase({}) as never);

    const response = await POST(request({ includeAdresse: true }));

    const payload = await response.json();
    expect(payload.logement.adresse).toBe("1 rue de Test");
  });
});
