-- Denormalized at submission time, same reasoning as artisan_siret
-- (0009_logement_equipements.sql): the owner needs to know whether/when a
-- décennale attestation exists without being granted read access to the
-- artisans table itself (which would also expose the artisan's login
-- email and any other future profile column).
alter table public.interventions
  add column attestation_decennale_path text,
  add column attestation_decennale_uploaded_at timestamptz;

-- Lets a propriétaire read an attestation file, but only for an artisan
-- who actually has an intervention on a logement they own — never a
-- blanket read on the whole 'artisans' bucket.
create policy "artisans_storage_select_owner" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'artisans'
    and exists (
      select 1
      from public.interventions i
      join public.logements l on l.id = i.logement_id
      where i.artisan_id::text = (storage.foldername(name))[1]
        and l.proprietaire_id = auth.uid()
    )
  );
