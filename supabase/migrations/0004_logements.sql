-- A logement (fiche logement) profile, which may exist before any owner has
-- claimed it (proprietaire_id null) — a future intervention or manual
-- creation flow (US-04, US-08) can create an orphaned row awaiting claim.

create table public.logements (
  id uuid primary key default gen_random_uuid(),
  adresse text not null,
  proprietaire_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.logements enable row level security;

grant select on public.logements to authenticated;

create policy "logements_select_owner" on public.logements
  for select
  to authenticated
  using (auth.uid() = proprietaire_id);

-- A single-use, time-limited invitation to claim a logement. RLS stays
-- deny-all forever: the only access path is through the SECURITY DEFINER
-- functions below, never a direct policy on this table.

create table public.logement_invitations (
  id uuid primary key default gen_random_uuid(),
  logement_id uuid not null references public.logements (id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.logement_invitations enable row level security;

-- Lets an unauthenticated visitor preview an invitation (the logement's
-- address and whether the token is still usable) before signing up.
create function public.preview_logement_invitation(invitation_token uuid)
returns table (adresse text, valid boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select l.adresse,
         (i.used_at is null and i.expires_at > now())
  from public.logement_invitations i
  join public.logements l on l.id = i.logement_id
  where i.token = invitation_token;
end;
$$;

grant execute on function public.preview_logement_invitation(uuid) to anon, authenticated;

-- Atomically validates and consumes an invitation, linking the logement to
-- the calling (authenticated) user. Raises if the token is missing, expired,
-- or already used, so a race between two claims can only ever succeed once.
create function public.claim_logement_invitation(invitation_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_logement_id uuid;
begin
  select i.logement_id into target_logement_id
  from public.logement_invitations i
  where i.token = invitation_token
    and i.used_at is null
    and i.expires_at > now()
  for update;

  if target_logement_id is null then
    raise exception 'invitation_invalid';
  end if;

  update public.logements set proprietaire_id = auth.uid() where id = target_logement_id;
  update public.logement_invitations set used_at = now() where token = invitation_token;

  return target_logement_id;
end;
$$;

grant execute on function public.claim_logement_invitation(uuid) to authenticated;
