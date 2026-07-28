-- A propriétaire's own address book of professionals they know or have
-- used — distinct from the artisans table (which models a platform
-- account that can submit interventions). A contact here may never have
-- worked on the logement at all. corps_metier reuses the existing enum
-- (kept nullable: unlike an intervention, a contact doesn't always come
-- with a known trade yet) so a future reminder/devis feature can filter
-- or group by it without inventing a second classification.
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  proprietaire_id uuid not null references auth.users (id) on delete cascade,
  nom text not null,
  corps_metier public.corps_metier,
  telephone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

grant select, insert, update, delete on public.contacts to authenticated;

create policy "contacts_select_owner" on public.contacts
  for select
  to authenticated
  using (auth.uid() = proprietaire_id);

create policy "contacts_insert_owner" on public.contacts
  for insert
  to authenticated
  with check (auth.uid() = proprietaire_id);

create policy "contacts_update_owner" on public.contacts
  for update
  to authenticated
  using (auth.uid() = proprietaire_id)
  with check (auth.uid() = proprietaire_id);

create policy "contacts_delete_owner" on public.contacts
  for delete
  to authenticated
  using (auth.uid() = proprietaire_id);
