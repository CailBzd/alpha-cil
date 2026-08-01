import { afterAll, describe, expect, it } from "vitest";
import "./setup";
import { closeFixturePool, createSignedInUser, fixtureQuery } from "./helpers";

// The freemium tier primitive (supabase/migrations/0037_abonnements_payants.sql)
// is deliberately read-only for `authenticated` — only service_role/the
// Postgres superuser ever writes a row today, since no billing integration
// exists yet. This pins that RLS shape in place.
describe("abonnements_payants RLS", () => {
  afterAll(async () => {
    await closeFixturePool();
  });

  it("select is scoped to the caller's own row", async () => {
    const owner = await createSignedInUser("tier-owner");
    const other = await createSignedInUser("tier-other");

    await fixtureQuery("insert into public.abonnements_payants (user_id) values ($1)", [
      owner.userId,
    ]);

    const own = await owner.client
      .from("abonnements_payants")
      .select("user_id")
      .eq("user_id", owner.userId)
      .maybeSingle();
    expect(own.error).toBeNull();
    expect(own.data?.user_id).toBe(owner.userId);

    const theirs = await other.client
      .from("abonnements_payants")
      .select("user_id")
      .eq("user_id", owner.userId)
      .maybeSingle();
    expect(theirs.error).toBeNull();
    expect(theirs.data).toBeNull();
  });

  it("authenticated users cannot insert/update/delete — no billing integration exists yet", async () => {
    const owner = await createSignedInUser("tier-write-attempt");

    const insertAttempt = await owner.client
      .from("abonnements_payants")
      .insert({ user_id: owner.userId });
    expect(insertAttempt.error).not.toBeNull();

    await fixtureQuery("insert into public.abonnements_payants (user_id) values ($1)", [
      owner.userId,
    ]);

    const updateAttempt = await owner.client
      .from("abonnements_payants")
      .update({ activated_at: new Date().toISOString() })
      .eq("user_id", owner.userId);
    expect(updateAttempt.error).not.toBeNull();

    const deleteAttempt = await owner.client
      .from("abonnements_payants")
      .delete()
      .eq("user_id", owner.userId);
    expect(deleteAttempt.error).not.toBeNull();
  });
});
