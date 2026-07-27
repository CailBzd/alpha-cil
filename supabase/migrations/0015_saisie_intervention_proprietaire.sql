-- A propriétaire can now record an intervention himself, without an
-- artisan: artisan_id, the facture, and the address-resolution fields
-- (only meaningful for the artisan flow's match_or_create_logement) all
-- become optional. A check constraint keeps every row traceable to either
-- an artisan or a directly-owned logement, never neither.
alter table public.interventions
  alter column artisan_id drop not null,
  alter column facture_path drop not null,
  alter column adresse_logement drop not null,
  alter column email_client drop not null,
  add constraint interventions_artisan_or_logement
    check (artisan_id is not null or logement_id is not null);

-- A propriétaire may insert an intervention only for their own logement,
-- and only without an artisan (the existing interventions_insert_self
-- policy already covers the artisan path, keyed on auth.uid() = artisan_id).
create policy "interventions_insert_owner" on public.interventions
  for insert
  to authenticated
  with check (
    artisan_id is null
    and exists (
      select 1
      from public.logements l
      where l.id = interventions.logement_id
        and l.proprietaire_id = auth.uid()
    )
  );
