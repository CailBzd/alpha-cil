import { createClient } from "@supabase/supabase-js";
import { Pool, type QueryResultRow } from "pg";

// These integration tests talk to a REAL local Supabase Postgres instance
// (RLS, SECURITY DEFINER functions, everything) — never mocked. They
// require `npx supabase start` to be running locally and must never be
// pointed at a hosted/production project.
function requireLocalEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name} — these integration tests require a running local Supabase instance ` +
        `(run \`npx supabase start\` first) with apps/web/.env pointing at it.`,
    );
  }
  if (!value.includes("127.0.0.1") && name === "SUPABASE_URL") {
    throw new Error(
      "SUPABASE_URL does not point at 127.0.0.1 — refusing to run integration tests against a non-local instance.",
    );
  }
  return value;
}

export function adminClient() {
  const url = requireLocalEnv("SUPABASE_URL");
  const serviceRoleKey = requireLocalEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

// The `service_role` Postgres role in this schema is only ever granted
// EXECUTE on a couple of cron RPCs (see US-11) — no table-level INSERT
// grants, by design (all writes are meant to go through RLS-scoped
// `authenticated` calls or SECURITY DEFINER functions). Widening
// service_role's grants just to make test fixtures easier to insert would
// weaken that deliberate posture, so test-fixture "arrange" steps instead
// connect directly as the local `postgres` superuser (only ever available
// against 127.0.0.1, never against a hosted project) and never touch RLS.
const pgPool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});

export async function fixtureQuery<T extends QueryResultRow = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
) {
  const result = await pgPool.query<T>(sql, params);
  return result.rows;
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}@example.com`;
}

export const TEST_PASSWORD = "integration-test-password-1";

/** Creates a pre-confirmed auth user and returns a signed-in client scoped to it (RLS applies as this user). */
export async function createSignedInUser(prefix: string) {
  const admin = adminClient();
  const email = uniqueEmail(prefix);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw new Error(`Failed to create test user ${email}: ${createError?.message}`);
  }

  const url = requireLocalEnv("SUPABASE_URL");
  const anonKey = requireLocalEnv("SUPABASE_ANON_KEY");
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { error: signInError } = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD });
  if (signInError) {
    throw new Error(`Failed to sign in test user ${email}: ${signInError.message}`);
  }

  return { client, userId: created.user.id, email };
}

export async function makeOwnerWithLogement(adresse: string) {
  const owner = await createSignedInUser("owner");

  const rows = await fixtureQuery<{ id: string }>(
    "insert into public.logements (adresse, proprietaire_id, contact_email) values ($1, $2, $3) returning id",
    [adresse, owner.userId, owner.email],
  );

  return { ...owner, logementId: rows[0].id };
}

export async function makeIntervention(logementId: string, typeTravaux: string) {
  const rows = await fixtureQuery<{ id: string }>(
    `insert into public.interventions
       (logement_id, type_travaux, date_intervention, montant_euros, corps_metier, artisan_id)
     values ($1, $2, '2026-01-15', 100, 'autre', null)
     returning id`,
    [logementId, typeTravaux],
  );
  return rows[0].id;
}

export async function makeArtisan() {
  const artisan = await createSignedInUser("artisan");
  await fixtureQuery(
    "insert into public.artisans (id, siret, corps_metier) values ($1, $2, array['autre']::public.corps_metier[])",
    [artisan.userId, "12345678900012"],
  );
  return artisan;
}

export async function makeAgence(prefix = "agence") {
  const agence = await createSignedInUser(prefix);
  await fixtureQuery("insert into public.agences (id, siret) values ($1, $2)", [
    agence.userId,
    "98765432100012",
  ]);
  return agence;
}

export async function makeGrant(
  logementId: string,
  overrides: Partial<{
    tiers_email: string;
    tiers_type: string;
    scope: string;
    expiresAt: string;
    revokedAt: string | null;
  }> = {},
) {
  const rows = await fixtureQuery<{ id: string; token: string }>(
    `insert into public.logement_access_grants
       (logement_id, tiers_email, tiers_type, scope, expires_at, revoked_at)
     values ($1, $2, $3, $4, $5, $6)
     returning id, token`,
    [
      logementId,
      overrides.tiers_email ?? "tiers@example.com",
      overrides.tiers_type ?? "agence",
      overrides.scope ?? "total",
      overrides.expiresAt ?? new Date(Date.now() + 86_400_000).toISOString(),
      overrides.revokedAt ?? null,
    ],
  );
  return rows[0];
}

export async function closeFixturePool() {
  await pgPool.end();
}
