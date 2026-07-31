import { expect, test } from "@playwright/test";
import { closeFixturePool, createSignedInUser, fixtureQuery, TEST_PASSWORD } from "../test/integration/helpers";

// resolvePersona (apps/web/lib/persona.ts) is the single source of truth
// every espace layout's server-side guard depends on, and it's only ever
// enforced per-page/per-layout (middleware.ts does session refresh only,
// no ACL) — a role-guard gap across the 3 personas was already found and
// fixed once (commit 0e5e193). Per the 2026-07-31 audit, nothing verified
// all 3 personas x 3 espace roots still redirect correctly. This is that
// matrix.
const ESPACE_ROOTS = [
  { persona: "artisan", path: "/artisan/espace", heading: "Mes interventions" },
  { persona: "proprietaire", path: "/proprietaire/espace", heading: "Mon logement" },
  { persona: "agence", path: "/agence/espace", heading: "Logements" },
] as const;

type PersonaName = (typeof ESPACE_ROOTS)[number]["persona"];

test.describe("persona role-guard matrix", () => {
  const emails: Record<PersonaName, string> = {} as Record<PersonaName, string>;

  test.beforeAll(async () => {
    const artisan = await createSignedInUser("e2e-artisan");
    await fixtureQuery(
      "insert into public.artisans (id, siret, corps_metier) values ($1, $2, array['autre']::public.corps_metier[])",
      [artisan.userId, "12345678900012"],
    );
    emails.artisan = artisan.email;

    const agence = await createSignedInUser("e2e-agence");
    await fixtureQuery("insert into public.agences (id, siret) values ($1, $2)", [
      agence.userId,
      "98765432100012",
    ]);
    emails.agence = agence.email;

    const proprietaire = await createSignedInUser("e2e-proprietaire");
    emails.proprietaire = proprietaire.email;
  });

  test.afterAll(async () => {
    await closeFixturePool();
  });

  for (const owner of ESPACE_ROOTS) {
    for (const target of ESPACE_ROOTS) {
      const label =
        target.persona === owner.persona
          ? `${owner.persona} can load their own ${target.path}`
          : `${owner.persona} visiting ${target.path} is redirected back to ${owner.path}`;

      test(label, async ({ page }) => {
        await page.goto(`/${owner.persona}/connexion`);
        await page.fill('input[name="email"]', emails[owner.persona]);
        await page.fill('input[name="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL(`**${owner.path}`);

        await page.goto(target.path);

        if (target.persona === owner.persona) {
          await expect(page.getByRole("heading", { name: target.heading, exact: true })).toBeVisible();
        } else {
          await page.waitForURL(`**${owner.path}`);
          await expect(page.getByRole("heading", { name: owner.heading, exact: true })).toBeVisible();
        }
      });
    }
  }
});
