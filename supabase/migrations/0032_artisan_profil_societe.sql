-- An artisan/company can legitimately work across several trades, not
-- just one — corps_metier becomes an array, mirroring the same change
-- logements.chauffage_type went through in 0021.
alter table public.artisans
  alter column corps_metier type public.corps_metier[]
  using array[corps_metier];

-- Company info an artisan can fill in beyond what SIRET verification
-- already captured (siret, denomination) — shown to owners so they know
-- who they're dealing with. siret itself stays read-only in the UI (not
-- DB-enforced, same convention as every other "read-only" field in this
-- app) since it was already verified once at signup.
alter table public.artisans
  add column telephone text,
  add column adresse text;
