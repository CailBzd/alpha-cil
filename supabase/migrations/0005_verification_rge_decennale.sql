-- Décennale attestation lives on the artisan profile (one per artisan,
-- reused across every intervention), not re-uploaded per intervention: an
-- insurance policy covers all interventions, not one at a time.
alter table public.artisans
  add column attestation_decennale_path text,
  add column attestation_decennale_uploaded_at timestamptz;

-- Private bucket for artisan profile-level documents (currently just the
-- décennale attestation), one folder per artisan.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artisans', 'artisans', false, 10485760, array['application/pdf']);

grant select, insert, update on storage.objects to authenticated;

create policy "artisans_storage_select_self" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'artisans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "artisans_storage_insert_self" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'artisans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "artisans_storage_update_self" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'artisans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- RGE verification result and timestamp, recorded once at submission time
-- (see packages/intervention). Défaut non vérifié tant que la vérification
-- n'a pas eu lieu.
alter table public.interventions
  add column rge_verifie boolean not null default false,
  add column rge_verifie_a timestamptz;
