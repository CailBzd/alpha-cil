-- Agency profile linked 1:1 to a Supabase Auth user, mirroring the artisans
-- table shape. Unlike artisans, agency signup is invitation-only (see
-- migration 0027's claim_agence_grant) and the SIRET is verified against a
-- real external registry before this row is ever inserted (packages/
-- intervention/src/sirene.ts), so there is no separate "verified" flag here
-- — the row's mere existence already implies a verified SIRET at creation
-- time. All three policies land in one migration since the pattern (self
-- select/insert/update, same shape as artisans across 0001/0006/0007) is
-- already proven, unlike when artisans was first built.

create table public.agences (
  id uuid primary key references auth.users (id) on delete cascade,
  siret text not null check (siret ~ '^[0-9]{14}$'),
  denomination text,
  created_at timestamptz not null default now()
);

alter table public.agences enable row level security;

grant select, insert, update on public.agences to authenticated;

create policy "agences_select_self" on public.agences
  for select
  to authenticated
  using (auth.uid() = id);

create policy "agences_insert_self" on public.agences
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "agences_update_self" on public.agences
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Same SIRET-verification feature lands on the artisan side: the
-- recherche-entreprises.api.gouv.fr lookup's denomination is now stored
-- alongside the (now-verified) siret, for both personas.
alter table public.artisans add column denomination text;
