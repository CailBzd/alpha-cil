-- Artisan profile linked 1:1 to a Supabase Auth user.
-- RLS is enabled with no policy: every row is inaccessible to every role
-- until an explicit policy is added (see migration 0002, shipped with the
-- signup feature in phase 2).

create type public.corps_metier as enum (
  'plombier',
  'electricien',
  'chauffagiste',
  'couvreur',
  'macon',
  'menuisier',
  'peintre',
  'carreleur',
  'autre'
);

create table public.artisans (
  id uuid primary key references auth.users (id) on delete cascade,
  siret text not null check (siret ~ '^[0-9]{14}$'),
  corps_metier public.corps_metier not null,
  created_at timestamptz not null default now()
);

alter table public.artisans enable row level security;
