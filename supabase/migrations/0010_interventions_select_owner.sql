-- The artisan's SIRET, denormalized at submission time (already fetched
-- there for the RGE check) so the owner-facing history can identify who
-- intervened without needing read access to the artisans table itself
-- (which would also expose the artisan's login email).
alter table public.interventions
  add column artisan_siret text;

-- The only existing select policy scopes to the submitting artisan; a
-- propriétaire also needs to read the interventions attached to their own
-- logement.
create policy "interventions_select_owner" on public.interventions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.logements l
      where l.id = interventions.logement_id
        and l.proprietaire_id = auth.uid()
    )
  );
