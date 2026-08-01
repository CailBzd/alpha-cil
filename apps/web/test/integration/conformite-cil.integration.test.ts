import { afterAll, describe, expect, it } from "vitest";
import "./setup";
import { closeFixturePool, makeOwnerWithLogement } from "./helpers";

// Legal CIL compliance, safe pass (supabase/migrations/0038_conformite_cil_pass_1.sql):
// the type_operation flag + entretien attestation file columns on
// logements (already covered by the existing logements_update_owner
// policy — nothing new to pin there), and the new private
// entretien-attestations storage bucket, which IS a new RLS surface.
describe("CIL compliance pass 1", () => {
  afterAll(async () => {
    await closeFixturePool();
  });

  it("an owner can set type_operation and read it back", async () => {
    const owner = await makeOwnerWithLogement(`30 rue conformite ${crypto.randomUUID()}`);

    const { error: updateError } = await owner.client
      .from("logements")
      .update({ type_operation: "renovation" })
      .eq("id", owner.logementId);
    expect(updateError).toBeNull();

    const { data } = await owner.client
      .from("logements")
      .select("type_operation")
      .eq("id", owner.logementId)
      .single();
    expect(data?.type_operation).toBe("renovation");
  });

  it("the entretien-attestations bucket scopes storage access to the uploading owner's own folder", async () => {
    const ownerA = await makeOwnerWithLogement(`31 rue attestation a ${crypto.randomUUID()}`);
    const ownerB = await makeOwnerWithLogement(`32 rue attestation b ${crypto.randomUUID()}`);

    const fakePdf = new Blob([new Uint8Array([37, 80, 68, 70])], { type: "application/pdf" });
    const path = `${ownerA.userId}/vmc.pdf`;

    const upload = await ownerA.client.storage
      .from("entretien-attestations")
      .upload(path, fakePdf, { contentType: "application/pdf", upsert: true });
    expect(upload.error).toBeNull();

    const ownFetch = await ownerA.client.storage.from("entretien-attestations").download(path);
    expect(ownFetch.error).toBeNull();

    const crossFetch = await ownerB.client.storage.from("entretien-attestations").download(path);
    expect(crossFetch.error).not.toBeNull();

    const crossUpload = await ownerB.client.storage
      .from("entretien-attestations")
      .upload(path, fakePdf, { contentType: "application/pdf", upsert: true });
    expect(crossUpload.error).not.toBeNull();
  });
});
