-- An artisan updates their own profile row (needed since phase 3 of US-03:
-- uploading/replacing the décennale attestation writes
-- attestation_decennale_path/_uploaded_at back onto their own row).

grant update on public.artisans to authenticated;

create policy "artisans_update_self" on public.artisans
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
