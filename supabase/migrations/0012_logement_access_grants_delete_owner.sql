-- Needed by the grant-creation Route Handler (US-10 phase 2): if inserting
-- the selected interventions for a 'partiel' grant fails partway through,
-- the just-created grant is deleted rather than left incomplete.

grant delete on public.logement_access_grants to authenticated;

create policy "logement_access_grants_delete_owner" on public.logement_access_grants
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.logements l
      where l.id = logement_access_grants.logement_id
        and l.proprietaire_id = auth.uid()
    )
  );
