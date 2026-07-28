-- Prospection tracking (#8), distinct from interventions (completed/
-- in-progress work): a projet groups several devis from different
-- contacts so they can be compared side by side before work is
-- commissioned. Kept as a plain comparison table for now — no AI/TCO
-- synthesis, that idea stays unscoped until the simple table proves
-- insufficient.
create type public.devis_statut as enum ('demande', 'recu', 'accepte', 'refuse');

create table public.projets (
  id uuid primary key default gen_random_uuid(),
  logement_id uuid not null references public.logements (id) on delete cascade,
  nom text not null,
  created_at timestamptz not null default now()
);

-- Every devis traces to a contact from #7's carnet — never a free-text
-- name — so the same professional is never represented twice under
-- slightly different spellings across projets.
create table public.devis (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references public.projets (id) on delete cascade,
  contact_id uuid not null references public.contacts (id),
  montant numeric(10, 2) check (montant > 0),
  conditions text,
  statut public.devis_statut not null default 'demande',
  date_devis date,
  created_at timestamptz not null default now()
);

alter table public.projets enable row level security;
alter table public.devis enable row level security;

grant select, insert, update, delete on public.projets to authenticated;
grant select, insert, update, delete on public.devis to authenticated;

create policy "projets_select_owner" on public.projets
  for select
  to authenticated
  using (
    exists (
      select 1 from public.logements l
      where l.id = projets.logement_id and l.proprietaire_id = auth.uid()
    )
  );

create policy "projets_insert_owner" on public.projets
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.logements l
      where l.id = projets.logement_id and l.proprietaire_id = auth.uid()
    )
  );

create policy "projets_delete_owner" on public.projets
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.logements l
      where l.id = projets.logement_id and l.proprietaire_id = auth.uid()
    )
  );

create policy "devis_select_owner" on public.devis
  for select
  to authenticated
  using (
    exists (
      select 1 from public.projets p
      join public.logements l on l.id = p.logement_id
      where p.id = devis.projet_id and l.proprietaire_id = auth.uid()
    )
  );

create policy "devis_insert_owner" on public.devis
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projets p
      join public.logements l on l.id = p.logement_id
      where p.id = devis.projet_id and l.proprietaire_id = auth.uid()
    )
  );

create policy "devis_update_owner" on public.devis
  for update
  to authenticated
  using (
    exists (
      select 1 from public.projets p
      join public.logements l on l.id = p.logement_id
      where p.id = devis.projet_id and l.proprietaire_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projets p
      join public.logements l on l.id = p.logement_id
      where p.id = devis.projet_id and l.proprietaire_id = auth.uid()
    )
  );

create policy "devis_delete_owner" on public.devis
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.projets p
      join public.logements l on l.id = p.logement_id
      where p.id = devis.projet_id and l.proprietaire_id = auth.uid()
    )
  );
