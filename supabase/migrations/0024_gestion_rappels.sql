-- Reminders as their own entity, managed by the owner directly — distinct
-- from (and coexisting with) the automatic chauffage/VMC entretien
-- reminders (US-11, logements_a_notifier_entretien), which are left
-- untouched: that system stays the cron-driven, email-sending mechanism
-- it already is. This is a manual, freeform list the owner controls
-- themselves, each optionally linked to a contact from #7's carnet
-- (nullable: not every reminder has a known contact yet).
create table public.rappels (
  id uuid primary key default gen_random_uuid(),
  logement_id uuid not null references public.logements (id) on delete cascade,
  titre text not null,
  date_echeance date not null,
  contact_id uuid references public.contacts (id) on delete set null,
  notes text,
  traite_a timestamptz,
  created_at timestamptz not null default now()
);

alter table public.rappels enable row level security;

grant select, insert, update, delete on public.rappels to authenticated;

create policy "rappels_select_owner" on public.rappels
  for select
  to authenticated
  using (
    exists (
      select 1 from public.logements l
      where l.id = rappels.logement_id and l.proprietaire_id = auth.uid()
    )
  );

create policy "rappels_insert_owner" on public.rappels
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.logements l
      where l.id = rappels.logement_id and l.proprietaire_id = auth.uid()
    )
  );

create policy "rappels_update_owner" on public.rappels
  for update
  to authenticated
  using (
    exists (
      select 1 from public.logements l
      where l.id = rappels.logement_id and l.proprietaire_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.logements l
      where l.id = rappels.logement_id and l.proprietaire_id = auth.uid()
    )
  );

create policy "rappels_delete_owner" on public.rappels
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.logements l
      where l.id = rappels.logement_id and l.proprietaire_id = auth.uid()
    )
  );
