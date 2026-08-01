import { compareDevis } from "@alpha-cil/ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const DEVIS = [{ contact: "Acme SARL", montant: 1200, conditions: null, statut: "recu", dateDevis: "2026-01-01" }];

describe("compareDevis", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.MISTRAL_API_KEY;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.MISTRAL_API_KEY = originalKey;
  });

  it("throws when there is nothing to compare", async () => {
    process.env.MISTRAL_API_KEY = "test-key";
    await expect(compareDevis([])).rejects.toThrow();
  });

  it("throws when MISTRAL_API_KEY is missing", async () => {
    delete process.env.MISTRAL_API_KEY;
    await expect(compareDevis(DEVIS)).rejects.toThrow(/MISTRAL_API_KEY/);
  });

  it("throws when Mistral responds with a non-2xx status", async () => {
    process.env.MISTRAL_API_KEY = "test-key";
    vi.mocked(global.fetch).mockResolvedValue(new Response("", { status: 500 }));

    await expect(compareDevis(DEVIS)).rejects.toThrow(/status 500/);
  });

  it("throws when Mistral returns no content", async () => {
    process.env.MISTRAL_API_KEY = "test-key";
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ choices: [] }), { status: 200 }),
    );

    await expect(compareDevis(DEVIS)).rejects.toThrow(/no content/);
  });

  it("returns the synthesis text on success", async () => {
    process.env.MISTRAL_API_KEY = "test-key";
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "Le devis Acme SARL est le plus complet." } }] }),
        { status: 200 },
      ),
    );

    await expect(compareDevis(DEVIS)).resolves.toBe("Le devis Acme SARL est le plus complet.");
  });
});
