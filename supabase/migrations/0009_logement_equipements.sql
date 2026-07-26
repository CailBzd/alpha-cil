-- Equipment fields a propriétaire can complete on their own fiche. Nullable:
-- absent until they fill them in (US-07), consumed later by reminder
-- generation (US-11).
create type public.chauffage_type as enum (
  'gaz',
  'electrique',
  'bois',
  'pompe_a_chaleur',
  'autre'
);

create type public.vmc_type as enum (
  'simple_flux',
  'double_flux',
  'aucune'
);

alter table public.logements
  add column chauffage_type public.chauffage_type,
  add column vmc_type public.vmc_type;

-- Only a select policy existed on logements until now; a propriétaire needs
-- to update their own fiche to complete these fields.
grant update on public.logements to authenticated;

create policy "logements_update_owner" on public.logements
  for update
  to authenticated
  using (auth.uid() = proprietaire_id)
  with check (auth.uid() = proprietaire_id);
