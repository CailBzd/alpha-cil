-- Legal CIL compliance, safe first pass (CCH R.126-32/R.126-34). Full
-- coverage (insulation materials, detailed equipment, energy audits,
-- new-build plans/schémas) is deferred to a second pass pending legal
-- sign-off on the exact field list — this pass only adds what's already
-- unambiguous: the neuf/rénovation distinction (which CIL requirements
-- even apply), and proof-of-entretien attachments (dates already existed
-- via 0016/0021, but no attached document, unlike artisans.attestation_
-- decennale_path).
alter table public.logements
  add column type_operation text check (type_operation in ('neuf', 'renovation')),
  add column attestation_entretien_vmc_path text,
  add column attestation_entretien_vmc_uploaded_at timestamptz,
  add column attestation_entretien_chauffage_gaz_path text,
  add column attestation_entretien_chauffage_gaz_uploaded_at timestamptz,
  add column attestation_entretien_chauffage_bois_path text,
  add column attestation_entretien_chauffage_bois_uploaded_at timestamptz;

-- Private bucket for owner-uploaded entretien proof documents, one folder
-- per owner — same shape as the 'artisans' bucket (0020_decennale_owner_
-- access.sql), but here the owner is the sole reader/writer (no artisan
-- cross-read case, unlike décennale).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('entretien-attestations', 'entretien-attestations', false, 10485760, array['application/pdf']);

grant select, insert, update on storage.objects to authenticated;

create policy "entretien_attestations_storage_select_owner" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'entretien-attestations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "entretien_attestations_storage_insert_owner" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'entretien-attestations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "entretien_attestations_storage_update_owner" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'entretien-attestations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
