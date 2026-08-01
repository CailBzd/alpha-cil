import { afterAll, describe, expect, it } from "vitest";
import "./setup";
import { closeFixturePool, fixtureQuery, makeArtisan, makeOwnerWithLogement } from "./helpers";

// logement_completude_pour_artisan (supabase/migrations/0039_completude_
// logement_rpc.sql) is the artisan growth-loop completeness indicator.
// Artisans have zero select policy on logements, deliberately — this RPC
// must never leak that row, only a scalar percentage, and only to an
// artisan who actually has an intervention on it.
describe("logement_completude_pour_artisan", () => {
  afterAll(async () => {
    await closeFixturePool();
  });

  it("returns null for an artisan with no intervention on the logement", async () => {
    const artisan = await makeArtisan();
    const owner = await makeOwnerWithLogement(`40 rue completude ${crypto.randomUUID()}`);

    const { data, error } = await artisan.client.rpc("logement_completude_pour_artisan", {
      p_logement_id: owner.logementId,
    });

    expect(error).toBeNull();
    expect(data?.[0]?.pourcentage).toBeNull();
  });

  it("returns a plausible percentage for an artisan with an intervention on the logement, and it rises as fields are filled in", async () => {
    const artisan = await makeArtisan();
    const owner = await makeOwnerWithLogement(`41 rue completude ${crypto.randomUUID()}`);

    await fixtureQuery(
      `insert into public.interventions
         (logement_id, type_travaux, date_intervention, montant_euros, corps_metier, artisan_id)
       values ($1, 'Révision', '2026-01-15', 100, 'autre', $2)`,
      [owner.logementId, artisan.userId],
    );

    const before = await artisan.client.rpc("logement_completude_pour_artisan", {
      p_logement_id: owner.logementId,
    });
    expect(before.error).toBeNull();
    const beforePct = before.data?.[0]?.pourcentage as number;
    expect(beforePct).not.toBeNull();
    expect(beforePct).toBeGreaterThanOrEqual(0);
    expect(beforePct).toBeLessThanOrEqual(100);

    await fixtureQuery(
      `update public.logements
       set type_operation = 'renovation', surface_habitable = 80, nombre_pieces = 4,
           annee_construction = 1990, dpe_classe_energie = 'C'
       where id = $1`,
      [owner.logementId],
    );

    const after = await artisan.client.rpc("logement_completude_pour_artisan", {
      p_logement_id: owner.logementId,
    });
    const afterPct = after.data?.[0]?.pourcentage as number;
    expect(afterPct).toBeGreaterThan(beforePct);
  });

  it("only ever returns a scalar percentage, never the underlying logement row", async () => {
    const artisan = await makeArtisan();
    const owner = await makeOwnerWithLogement(`42 rue completude ${crypto.randomUUID()}`);
    await fixtureQuery(
      `insert into public.interventions
         (logement_id, type_travaux, date_intervention, montant_euros, corps_metier, artisan_id)
       values ($1, 'Révision', '2026-01-15', 100, 'autre', $2)`,
      [owner.logementId, artisan.userId],
    );

    const { data } = await artisan.client.rpc("logement_completude_pour_artisan", {
      p_logement_id: owner.logementId,
    });

    const row = data?.[0] ?? {};
    expect(Object.keys(row)).toEqual(["pourcentage"]);
  });
});
