# Codebase Re-audit: alpha-cil (post-fix verification, same day)

Re-ran the full 7-pillar audit after the 2026-07-31 session that fixed all 8 criticals and all 24 warnings from the first pass. Every fix was independently re-derived and verified (not re-checked against the prior report's claims alone) — all hold up. Zero new critical findings. A handful of small warning-level items surfaced from the fixes themselves (the refactors' own blind spots), plus the previously-deferred minors are confirmed still accurate.

- **Date**: 2026-07-31 (same day as the original audit + fix pass)
- **Scope**: full monorepo, all 7 pillars
- **Health**: good (up from fair) — no critical findings, no systemic issues; a small number of fresh warnings from this session's own refactors
- **Findings**: 0 critical, 13 warning, ~20 minor

## What was verified clean (no re-listing — see each pillar's file for full detail)

- **Security**: migrations `0034` (artisan-only guard on `match_or_create_logement`) and `0035` (column-locked `artisans` update) both read correctly, gate every branch, and match every real call site. Migration `0036` is confirmed index-only.
- **Performance**: FK index list independently re-derived from all 36 migrations — complete, no gaps. Fetch timeouts and the `Promise.all` parallelization are correctly placed and race-free.
- **Dependencies**: all 4 same-day fixes (postcss/sharp overrides, resend/lucide-react/tailwind-merge bumps) confirmed resolved in `pnpm-lock.yaml`, not just `package.json` ranges. `pnpm audit` clean.
- **Architecture**: artisan layout extraction, `RendezVousRow` delete-via-handler, and the INSTALL.md correction all landed with no loose ends. Every shared module (`supabase-server.ts`, `siret-signup.ts`, `ConnexionForm.tsx`) is used consistently everywhere it should be.
- **Tests**: all 39 tests (16 unit + 14 integration + 9 e2e) actually re-run and pass against this checkout, not just assumed passing.
- **UI**: the responsive shell and artisan-nav fixes hold up across all 3 personas, no divergence.

## Fresh findings (introduced by this session's own fixes, or newly surfaced)

| Sev | Category | Location | Issue | Suggested fix | Effort |
| --- | --- | --- | --- | --- | --- |
| 🟡 | architecture | `apps/web/app/(public)/agence/connexion/page.tsx:22` | The new shared `ConnexionForm`'s `afterSignIn` callback calls the mutating RPC `claim_agence_grant` directly from the browser — bypassing the Route Handler convention the same session just documented in INSTALL.md (agence *signup* does this correctly via a Route Handler; agence *connexion* doesn't). | Add `POST /api/agence/claim-grant` wrapping the RPC; have `afterSignIn` call that instead. | S |
| 🟡 | code-quality | 3 persona signup forms (`artisan/inscription/page.tsx`, `proprietaire/inscription/ProprietaireInscriptionForm.tsx`, `agence/inscription/AgenceInscriptionForm.tsx`) | `ConnexionForm` solved duplication for sign-in but not sign-up — the 3 signup forms are ~90% identical and actively drifting (SIRET/corps-métier logic added independently to 2 of 3 copies same-day). | Extract a shared `InscriptionForm`/`useSignupSubmit` mirroring `ConnexionForm`'s shape. | M |
| 🟡 | ui | 5 row components (`ContactRow`, `RappelRow`, `DevisRow`, `RendezVousRow`, `ArtisanRendezVousRow`) | This session's new error `<Alert>`s lack `w-full` (unlike sibling spans in the same flex-wrap rows), so they can render squeezed onto the same line instead of their own. | Add `className="w-full"` to the 5 `<Alert>` call sites. | S |
| 🟡 | security | `supabase/migrations/0008_rattachement_logement.sql` (via `0034`'s redefinition) | `match_or_create_logement` never got an explicit `revoke execute from public`, unlike the repo's own convention for other sensitive functions — currently harmless (guard checks `auth.uid()`) but a latent inconsistency. | Add the `revoke` in a follow-up migration. | S |
| 🟡 | tests | `apps/web/app/(public)/agence/connexion/page.tsx` + `ConnexionForm.tsx`'s blocked-message branch | Agence's invitation-claim error mapping (5 failure reasons → French messages) has zero test coverage at any level — the e2e matrix never signs in with a `?token=`. | One e2e case with an expired/claimed token; fixtures already exist. | S |
| 🟡 | performance | `apps/web/app/(owner)/proprietaire/espace/LogementMap.tsx:29-31` | Client-side geocoding fetch has no timeout, unlike the 3 server-side calls just fixed. | Add `AbortSignal.timeout(5000)`. | S |
| 🟡 | tests | `packages/notifications/src/mailer.ts` — now 6 call sites (was 2) | Blast radius grew since the last audit (rendez-vous emails + cron reminders added); still zero test of differing failure-handling contracts, notably the cron's "send succeeds, DB update fails → resends forever" risk. | Unit test the cron route's two failure modes. | S |
| 🟡 | security | `supabase/migrations/0025_devis_projets.sql:77-86` | Still open, unchanged: `devis_insert_owner`/`devis_update_owner` don't verify `contact_id` ownership. | Add the cross-table ownership check. | S |
| 🟡 | ui | 5 delete/revoke actions | Still open, unchanged: no confirmation step before delete. | Reuse the existing `window.confirm()` pattern. | S |
| 🟡 | ui | `CalendrierList.tsx:131-151` | Still open, unchanged: filter chips have no `aria-pressed`. | Add the attribute. | S |
| 🟡 | tests | `packages/intervention/src/{sirene,ademe}.ts`, `packages/logement/src/dpe.ts` | Still open, unchanged: no fetch-injection seam for the 3 gov-API adapters. | Add an injectable fetch + fixtures. | M |
| 🟡 | tests | RLS policies, 36 migrations now | Still no pgTAP harness; migration `0035` (new) has no direct SQL-level test. | Stand up `supabase test db`, starting with 0035. | L |
| 🟡 | dependencies | `apps/web/package.json` (`next`) | Still deliberately deferred: 15.5.21 vs 16.2.12. | Dedicated Next 16 migration pass. | M |

## Minor items (confirmed still accurate, unchanged, or newly noted as "no action needed" — see per-pillar files for the full list)

`EspaceSidebar.tsx` now triplicated (a 3rd copy from the new artisan layout) · homepage nav still missing an "Espace agence" link · corps-métier checkbox checklist duplicated between artisan signup and `SocieteForm` · `RevokeButton.tsx` left out of the row error-handling pass (only one of 5 with neither confirmation nor error feedback) · unstyled checkboxes/radios/file inputs · no CI workflow · PDF export and cron idempotency untested · `createSiretAccount`/`getServerSupabaseClient` only indirectly unit-tested (organizational nit, coverage is real) · trivial dependency patch bumps available · `react-leaflet`'s Hippocratic-2.1 license still needs a legal call.

## Coverage

- **Scanned**: code-quality, architecture, security, dependencies, performance, tests, ui
- **Skipped**: none
- **Method**: each pillar agent was told what was claimed fixed and instructed to verify independently (re-read the actual migrations/code, re-run the actual test suites, re-derive lists like the FK set from scratch) rather than trust the prior report.
