import { compareDevis } from "@foya/ai";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/supabase-server", () => ({ getServerSupabaseClient: vi.fn() }));
vi.mock("@foya/ai", () => ({ compareDevis: vi.fn() }));

const DEVIS_ROWS = [
  { contact_id: "contact-1", montant: 1000, conditions: null, statut: "recu", date_devis: "2026-01-01" },
];
const CONTACTS = [{ id: "contact-1", nom: "Acme SARL" }];

function fakeSupabase(opts: {
  authenticated?: boolean;
  quota?: { autorise: boolean; raison: string | null };
  devis?: typeof DEVIS_ROWS;
  insertError?: boolean;
}) {
  const authenticated = opts.authenticated ?? true;
  const quota = opts.quota ?? { autorise: true, raison: null };
  const devis = opts.devis === undefined ? DEVIS_ROWS : opts.devis;

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: authenticated ? { id: "user-1" } : null } }),
    },
    rpc: vi.fn().mockResolvedValue({ data: [quota], error: null }),
    from: vi.fn((table: string) => {
      if (table === "devis") {
        return { select: () => ({ eq: async () => ({ data: devis }) }) };
      }
      if (table === "contacts") {
        return { select: () => ({ in: async () => ({ data: CONTACTS }) }) };
      }
      if (table === "projet_analyses_ia") {
        return {
          insert: () => ({
            select: () => ({
              single: async () =>
                opts.insertError
                  ? { data: null, error: { message: "boom" } }
                  : {
                      data: {
                        id: "analyse-1",
                        contenu: "synthèse",
                        modele: "mistral-large-latest",
                        created_at: "2026-01-01T00:00:00.000Z",
                      },
                      error: null,
                    },
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function request() {
  return new Request("http://localhost/api/proprietaire/projets/projet-1/analyse-ia", {
    method: "POST",
  });
}

function params() {
  return { params: Promise.resolve({ projetId: "projet-1" }) };
}

describe("POST /api/proprietaire/projets/[projetId]/analyse-ia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an unauthenticated caller", async () => {
    vi.mocked(getServerSupabaseClient).mockResolvedValue(
      fakeSupabase({ authenticated: false }) as never,
    );

    const response = await POST(request(), params());

    expect(response.status).toBe(401);
  });

  it("returns 403 when the caller doesn't own the projet", async () => {
    vi.mocked(getServerSupabaseClient).mockResolvedValue(
      fakeSupabase({ quota: { autorise: false, raison: "forbidden" } }) as never,
    );

    const response = await POST(request(), params());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden" });
  });

  it("returns 429 when the quota is exhausted", async () => {
    vi.mocked(getServerSupabaseClient).mockResolvedValue(
      fakeSupabase({ quota: { autorise: false, raison: "quota_depasse" } }) as never,
    );

    const response = await POST(request(), params());

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "quota_depasse" });
    expect(compareDevis).not.toHaveBeenCalled();
  });

  it("returns 400 when the projet has no devis", async () => {
    vi.mocked(getServerSupabaseClient).mockResolvedValue(fakeSupabase({ devis: [] }) as never);

    const response = await POST(request(), params());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "aucun_devis" });
  });

  it("returns 502 and does not persist anything when the AI call fails", async () => {
    vi.mocked(compareDevis).mockRejectedValue(new Error("mistral down"));
    const supabase = fakeSupabase({});
    vi.mocked(getServerSupabaseClient).mockResolvedValue(supabase as never);

    const response = await POST(request(), params());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "ai_indisponible" });
  });

  it("succeeds, calling compareDevis with the resolved contact names and persisting the result", async () => {
    vi.mocked(compareDevis).mockResolvedValue("synthèse");
    vi.mocked(getServerSupabaseClient).mockResolvedValue(fakeSupabase({}) as never);

    const response = await POST(request(), params());

    expect(response.status).toBe(200);
    expect(compareDevis).toHaveBeenCalledWith([
      { contact: "Acme SARL", montant: 1000, conditions: null, statut: "recu", dateDevis: "2026-01-01" },
    ]);
    const body = await response.json();
    expect(body.analyse.contenu).toBe("synthèse");
  });
});
