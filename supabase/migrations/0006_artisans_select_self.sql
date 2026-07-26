-- An artisan reads their own profile row (needed since phase 2 of US-03:
-- the intervention submission handler looks up the caller's own SIRET to
-- run the RGE check). No select policy existed on this table until now —
-- only insert was ever needed before.

grant select on public.artisans to authenticated;

create policy "artisans_select_self" on public.artisans
  for select
  to authenticated
  using (auth.uid() = id);
