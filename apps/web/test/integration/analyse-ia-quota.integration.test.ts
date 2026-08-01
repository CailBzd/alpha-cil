import { afterAll, describe, expect, it } from "vitest";
import "./setup";
import { closeFixturePool, createSignedInUser, fixtureQuery, makeOwnerWithLogement } from "./helpers";

async function makeProjet(logementId: string) {
  const rows = await fixtureQuery<{ id: string }>(
    "insert into public.projets (logement_id, nom) values ($1, 'Rénovation toiture') returning id",
    [logementId],
  );
  return rows[0].id;
}

async function makeAnalyse(projetId: string, createdAt: string) {
  await fixtureQuery(
    "insert into public.projet_analyses_ia (projet_id, contenu, modele, created_at) values ($1, 'synthèse', 'mistral-large-latest', $2)",
    [projetId, createdAt],
  );
}

// peut_lancer_analyse_ia (supabase/migrations/0040_projet_analyses_ia.sql)
// is the single source of truth for the AI devis-comparison quota: free
// tier usable once ever per projet, paid tier once per rolling 24h.
describe("peut_lancer_analyse_ia", () => {
  afterAll(async () => {
    await closeFixturePool();
  });

  it("forbids a caller who doesn't own the projet's logement", async () => {
    const owner = await makeOwnerWithLogement(`50 rue ia ${crypto.randomUUID()}`);
    const projetId = await makeProjet(owner.logementId);
    const other = await createSignedInUser("ia-other");

    const { data } = await other.client.rpc("peut_lancer_analyse_ia", { p_projet_id: projetId });

    expect(data?.[0]?.autorise).toBe(false);
    expect(data?.[0]?.raison).toBe("forbidden");
  });

  it("allows a gratuit owner's first analysis, then blocks a second", async () => {
    const owner = await makeOwnerWithLogement(`51 rue ia ${crypto.randomUUID()}`);
    const projetId = await makeProjet(owner.logementId);

    const first = await owner.client.rpc("peut_lancer_analyse_ia", { p_projet_id: projetId });
    expect(first.data?.[0]?.autorise).toBe(true);

    await makeAnalyse(projetId, new Date().toISOString());

    const second = await owner.client.rpc("peut_lancer_analyse_ia", { p_projet_id: projetId });
    expect(second.data?.[0]?.autorise).toBe(false);
    expect(second.data?.[0]?.raison).toBe("quota_depasse");
  });

  it("allows a payant owner once per rolling 24h, not more often", async () => {
    const owner = await makeOwnerWithLogement(`52 rue ia ${crypto.randomUUID()}`);
    const projetId = await makeProjet(owner.logementId);
    await fixtureQuery("insert into public.abonnements_payants (user_id) values ($1)", [
      owner.userId,
    ]);

    const recent = await owner.client.rpc("peut_lancer_analyse_ia", { p_projet_id: projetId });
    expect(recent.data?.[0]?.autorise).toBe(true);

    await makeAnalyse(projetId, new Date().toISOString());

    const tooSoon = await owner.client.rpc("peut_lancer_analyse_ia", { p_projet_id: projetId });
    expect(tooSoon.data?.[0]?.autorise).toBe(false);
    expect(tooSoon.data?.[0]?.raison).toBe("quota_depasse");

    await fixtureQuery(
      "update public.projet_analyses_ia set created_at = now() - interval '25 hours' where projet_id = $1",
      [projetId],
    );

    const afterADay = await owner.client.rpc("peut_lancer_analyse_ia", { p_projet_id: projetId });
    expect(afterADay.data?.[0]?.autorise).toBe(true);
  });
});
