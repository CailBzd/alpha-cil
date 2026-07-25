-- Intervention declared by an artisan on a client's property. Owner-only
-- read/write via RLS; extended by a future migration when US-03 adds
-- verification statuses beyond the initial "pending" state.

create type public.intervention_statut as enum (
  'en_attente_verification'
);

create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisans (id) on delete cascade,
  type_travaux text not null,
  date_intervention date not null,
  montant_euros numeric(10, 2) not null check (montant_euros > 0),
  corps_metier public.corps_metier not null,
  facture_path text not null,
  photos text[] not null default '{}',
  statut public.intervention_statut not null default 'en_attente_verification',
  created_at timestamptz not null default now()
);

alter table public.interventions enable row level security;

grant select, insert on public.interventions to authenticated;

create policy "interventions_select_self" on public.interventions
  for select
  to authenticated
  using (auth.uid() = artisan_id);

create policy "interventions_insert_self" on public.interventions
  for insert
  to authenticated
  with check (auth.uid() = artisan_id);

-- Private bucket for facture PDFs and before/after photos, one folder per
-- artisan (<artisan_id>/...), enforced by the storage.objects policies below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'interventions',
  'interventions',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
);

grant select, insert on storage.objects to authenticated;

create policy "interventions_storage_select_self" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'interventions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "interventions_storage_insert_self" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'interventions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
