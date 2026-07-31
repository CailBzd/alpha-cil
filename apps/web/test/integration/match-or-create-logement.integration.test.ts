import { afterAll, describe, expect, it } from "vitest";
import "./setup";
import { closeFixturePool, makeArtisan, makeOwnerWithLogement } from "./helpers";

const RPC_ARGS_BASE = {
  p_dpe_classe_energie: null,
  p_dpe_classe_ges: null,
  p_dpe_consommation: null,
  p_dpe_emissions: null,
  p_dpe_date_diagnostic: null,
  p_surface_habitable: null,
};

// match_or_create_logement is the single most powerful RLS bypass in the
// schema (an artisan can search/create across every owner's logements) and,
// per the 2026-07-31 security audit, was reachable by ANY authenticated
// account (not just artisans) via direct PostgREST calls, leaking another
// owner's real email for any guessed/known address — fixed by migration
// 0034. This suite covers both that fix and the function's branch logic
// (no match, existing unclaimed match, already-claimed match, ambiguous).
describe("match_or_create_logement", () => {
  afterAll(closeFixturePool);

  it("returns nothing to a caller who isn't a verified artisan (the 2026-07-31 email-leak fix)", async () => {
    const owner = await makeOwnerWithLogement(`9 rue non-artisan ${crypto.randomUUID()}`);

    const { data, error } = await owner.client.rpc("match_or_create_logement", {
      p_adresse: owner.email, // arbitrary address string, irrelevant here
      p_contact_email: "attacker@example.com",
      ...RPC_ARGS_BASE,
    });

    expect(error).toBeNull();
    const row = data?.[0];
    expect(row.logement_id).toBeNull();
    expect(row.notify_email).toBeNull();
    expect(row.created).toBe(false);
  });

  it("creates a new logement + invitation when no address matches", async () => {
    const artisan = await makeArtisan();
    const adresse = `10 rue nouvelle ${crypto.randomUUID()}`;

    const { data, error } = await artisan.client.rpc("match_or_create_logement", {
      p_adresse: adresse,
      p_contact_email: "client@example.com",
      ...RPC_ARGS_BASE,
    });

    expect(error).toBeNull();
    const row = data?.[0];
    expect(row.created).toBe(true);
    expect(row.ambiguous).toBe(false);
    expect(row.logement_id).not.toBeNull();
    expect(row.invitation_token).not.toBeNull();
  });

  it("notifies the existing owner's real email when the artisan matches an already-claimed address", async () => {
    const artisan = await makeArtisan();
    const adresse = `11 rue deja reclamee ${crypto.randomUUID()}`;
    const owner = await makeOwnerWithLogement(adresse);

    const { data, error } = await artisan.client.rpc("match_or_create_logement", {
      p_adresse: adresse,
      p_contact_email: "client@example.com",
      ...RPC_ARGS_BASE,
    });

    expect(error).toBeNull();
    const row = data?.[0];
    expect(row.created).toBe(false);
    expect(row.ambiguous).toBe(false);
    expect(row.logement_id).toBe(owner.logementId);
    expect(row.notify_email).toBe(owner.email);
  });

  it("rejects as ambiguous when two logements share the same normalized address", async () => {
    const artisan = await makeArtisan();
    const adresse = `12 rue ambigue ${crypto.randomUUID()}`;
    await makeOwnerWithLogement(adresse);
    await makeOwnerWithLogement(`  ${adresse.toUpperCase()}  `);

    const { data, error } = await artisan.client.rpc("match_or_create_logement", {
      p_adresse: adresse,
      p_contact_email: "client@example.com",
      ...RPC_ARGS_BASE,
    });

    expect(error).toBeNull();
    const row = data?.[0];
    expect(row.ambiguous).toBe(true);
    expect(row.logement_id).toBeNull();
    expect(row.notify_email).toBeNull();
  });
});
