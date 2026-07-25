-- An authenticated user may insert their own artisan profile row, and no
-- other. Selection, update, and delete policies remain unaddressed (deny-all)
-- until the stories that need them.
--
-- The base table privilege grant is required in addition to the RLS policy:
-- Postgres checks table-level GRANTs before RLS is ever evaluated, and
-- Supabase does not grant them automatically outside the Studio UI.

grant insert on public.artisans to authenticated;

create policy "artisans_insert_self" on public.artisans
  for insert
  to authenticated
  with check (auth.uid() = id);
