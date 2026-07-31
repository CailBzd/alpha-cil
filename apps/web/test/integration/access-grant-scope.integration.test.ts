import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "./setup";
import {
  closeFixturePool,
  makeGrant,
  makeIntervention,
  makeOwnerWithLogement,
} from "./helpers";

// Regression test for the cross-tenant leak fixed in
// 0018_acces_carnet_scope_interventions.sql: the insert policy on
// logement_access_grant_interventions originally only checked that the
// GRANT belonged to the caller's own logement, never that the INTERVENTION
// being attached also belonged to that same logement — letting an owner
// attach another owner's intervention to their own grant and leak it
// through a 'partiel' consultation link. Nothing pinned this fix in place
// before this test (audit finding, 2026-07-31).
describe("logement_access_grant_interventions insert policy (0018 regression)", () => {
  let ownerA: Awaited<ReturnType<typeof makeOwnerWithLogement>>;
  let ownerB: Awaited<ReturnType<typeof makeOwnerWithLogement>>;
  let interventionA: string;
  let interventionB: string;
  let grantAId: string;
  let grantAToken: string;

  beforeAll(async () => {
    ownerA = await makeOwnerWithLogement(`1 rue A ${crypto.randomUUID()}`);
    ownerB = await makeOwnerWithLogement(`2 rue B ${crypto.randomUUID()}`);
    interventionA = await makeIntervention(ownerA.logementId, "Révision chaudière");
    interventionB = await makeIntervention(ownerB.logementId, "Fuite");

    const grant = await makeGrant(ownerA.logementId, { scope: "partiel" });
    grantAId = grant.id;
    grantAToken = grant.token;
  });

  afterAll(closeFixturePool);

  it("rejects attaching another owner's intervention to your own grant", async () => {
    const { error } = await ownerA.client
      .from("logement_access_grant_interventions")
      .insert({ grant_id: grantAId, intervention_id: interventionB });

    expect(error).not.toBeNull();
  });

  it("still allows attaching your own intervention to your own grant", async () => {
    const { error } = await ownerA.client
      .from("logement_access_grant_interventions")
      .insert({ grant_id: grantAId, intervention_id: interventionA });

    expect(error).toBeNull();
  });

  it("list_granted_interventions never surfaces the other owner's intervention through the partiel link", async () => {
    const { data, error } = await ownerA.client.rpc("list_granted_interventions", {
      p_token: grantAToken,
    });

    expect(error).toBeNull();
    const ids = (data ?? []).map((row: { id: string }) => row.id);
    expect(ids).toContain(interventionA);
    expect(ids).not.toContain(interventionB);
  });
});
