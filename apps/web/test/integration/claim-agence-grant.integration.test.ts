import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "./setup";
import { closeFixturePool, fixtureQuery, makeAgence, makeGrant, makeOwnerWithLogement } from "./helpers";

// claim_agence_grant is a token-hijack surface for agency access to an
// owner's logement carnet (row-locked, 6-branch authz) that the
// 2026-07-31 audit found had zero test coverage. Covers every branch
// except the concurrent-double-claim race (the `for update` lock exists
// for) — worth a dedicated follow-up.
describe("claim_agence_grant", () => {
  let owner: Awaited<ReturnType<typeof makeOwnerWithLogement>>;
  let agence1: Awaited<ReturnType<typeof makeAgence>>;
  let agence2: Awaited<ReturnType<typeof makeAgence>>;

  beforeAll(async () => {
    owner = await makeOwnerWithLogement(`20 rue agence ${crypto.randomUUID()}`);
    agence1 = await makeAgence("agence1");
    agence2 = await makeAgence("agence2");
  });

  afterAll(closeFixturePool);

  it("returns not_found for an unknown token", async () => {
    const { data, error } = await agence1.client.rpc("claim_agence_grant", {
      p_token: crypto.randomUUID(),
    });
    expect(error).toBeNull();
    expect(data).toBe("not_found");
  });

  it("returns wrong_type for a grant addressed to a non-agence tiers", async () => {
    const grant = await makeGrant(owner.logementId, {
      tiers_email: agence1.email,
      tiers_type: "autre",
    });
    const { data } = await agence1.client.rpc("claim_agence_grant", { p_token: grant.token });
    expect(data).toBe("wrong_type");
  });

  it("returns expired_or_revoked for a grant past its expiry", async () => {
    const grant = await makeGrant(owner.logementId, {
      tiers_email: agence1.email,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
    const { data } = await agence1.client.rpc("claim_agence_grant", { p_token: grant.token });
    expect(data).toBe("expired_or_revoked");
  });

  it("returns expired_or_revoked for a grant that was revoked", async () => {
    const grant = await makeGrant(owner.logementId, {
      tiers_email: agence1.email,
      revokedAt: new Date().toISOString(),
    });
    const { data } = await agence1.client.rpc("claim_agence_grant", { p_token: grant.token });
    expect(data).toBe("expired_or_revoked");
  });

  it("returns email_mismatch when the caller's email isn't the one the grant was addressed to", async () => {
    const grant = await makeGrant(owner.logementId, { tiers_email: agence1.email });
    const { data } = await agence2.client.rpc("claim_agence_grant", { p_token: grant.token });
    expect(data).toBe("email_mismatch");
  });

  it("succeeds for the rightful agency and is idempotent on reclaim", async () => {
    const grant = await makeGrant(owner.logementId, { tiers_email: agence1.email });

    const first = await agence1.client.rpc("claim_agence_grant", { p_token: grant.token });
    expect(first.data).toBe("success");

    const rows = await fixtureQuery<{ agence_id: string }>(
      "select agence_id from public.logement_access_grants where id = $1",
      [grant.id],
    );
    expect(rows[0].agence_id).toBe(agence1.userId);

    const reclaim = await agence1.client.rpc("claim_agence_grant", { p_token: grant.token });
    expect(reclaim.data).toBe("success");
  });

  it("returns claimed_by_other when a second agency shares the grant's addressed email but it's already taken", async () => {
    const grant = await makeGrant(owner.logementId, { tiers_email: agence1.email });
    await agence1.client.rpc("claim_agence_grant", { p_token: grant.token });

    // Re-point the grant's addressed email to agence2 directly (simulates
    // the owner editing the grant's tiers_email after agence1 already
    // claimed it) so agence2 clears the email check and reaches the
    // claimed_by_other branch specifically.
    await fixtureQuery("update public.logement_access_grants set tiers_email = $1 where id = $2", [
      agence2.email,
      grant.id,
    ]);

    const { data } = await agence2.client.rpc("claim_agence_grant", { p_token: grant.token });
    expect(data).toBe("claimed_by_other");
  });
});
