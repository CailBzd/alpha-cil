-- A propriétaire-granted access to a named third party, scoped to a
-- duration, and either total or limited to specific interventions (see the
-- join table below). Revocation (revoked_at) and expiry (expires_at) are
-- re-checked on every read, never cached.
create table public.logement_access_grants (
  id uuid primary key default gen_random_uuid(),
  logement_id uuid not null references public.logements (id) on delete cascade,
  tiers_email text not null,
  token uuid not null unique default gen_random_uuid(),
  scope text not null check (scope in ('total', 'partiel')),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- Only populated when scope = 'partiel': the exact interventions the
-- propriétaire selected to share, nothing implicit.
create table public.logement_access_grant_interventions (
  grant_id uuid not null references public.logement_access_grants (id) on delete cascade,
  intervention_id uuid not null references public.interventions (id) on delete cascade,
  primary key (grant_id, intervention_id)
);

alter table public.logement_access_grants enable row level security;
alter table public.logement_access_grant_interventions enable row level security;

grant select, insert, update on public.logement_access_grants to authenticated;

create policy "logement_access_grants_select_owner" on public.logement_access_grants
  for select
  to authenticated
  using (
    exists (
      select 1 from public.logements l
      where l.id = logement_access_grants.logement_id
        and l.proprietaire_id = auth.uid()
    )
  );

create policy "logement_access_grants_insert_owner" on public.logement_access_grants
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.logements l
      where l.id = logement_access_grants.logement_id
        and l.proprietaire_id = auth.uid()
    )
  );

create policy "logement_access_grants_update_owner" on public.logement_access_grants
  for update
  to authenticated
  using (
    exists (
      select 1 from public.logements l
      where l.id = logement_access_grants.logement_id
        and l.proprietaire_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.logements l
      where l.id = logement_access_grants.logement_id
        and l.proprietaire_id = auth.uid()
    )
  );

grant select, insert on public.logement_access_grant_interventions to authenticated;

create policy "logement_access_grant_interventions_select_owner" on public.logement_access_grant_interventions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.logement_access_grants g
      join public.logements l on l.id = g.logement_id
      where g.id = logement_access_grant_interventions.grant_id
        and l.proprietaire_id = auth.uid()
    )
  );

create policy "logement_access_grant_interventions_insert_owner" on public.logement_access_grant_interventions
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.logement_access_grants g
      join public.logements l on l.id = g.logement_id
      where g.id = logement_access_grant_interventions.grant_id
        and l.proprietaire_id = auth.uid()
    )
  );

-- Validates a consultation token and returns the logement's basic info —
-- but only for scope = 'total'. A 'partiel' grant never exposes adresse or
-- équipements, even through this function: scope is enforced here, not left
-- to the calling page to hide fields correctly.
create function public.validate_access_grant(p_token uuid)
returns table (
  logement_id uuid,
  adresse text,
  chauffage_type public.chauffage_type,
  vmc_type public.vmc_type,
  scope text,
  valid boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant record;
begin
  select g.logement_id, g.scope, (g.revoked_at is null and g.expires_at > now()) as is_valid
  into v_grant
  from public.logement_access_grants g
  where g.token = p_token;

  if not found then
    return;
  end if;

  if v_grant.scope = 'total' and v_grant.is_valid then
    return query
    select l.id, l.adresse, l.chauffage_type, l.vmc_type, v_grant.scope, v_grant.is_valid
    from public.logements l
    where l.id = v_grant.logement_id;
  else
    return query
    select v_grant.logement_id, null::text, null::public.chauffage_type, null::public.vmc_type,
           v_grant.scope, v_grant.is_valid;
  end if;
end;
$$;

grant execute on function public.validate_access_grant(uuid) to anon, authenticated;

-- Lists the interventions a valid token authorizes: all of them for
-- 'total', only the explicitly selected ones for 'partiel'. Re-validates
-- revocation/expiry itself rather than trusting a prior call.
create function public.list_granted_interventions(p_token uuid)
returns table (
  id uuid,
  type_travaux text,
  date_intervention date,
  artisan_siret text,
  rge_verifie boolean,
  rge_verifie_a timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant record;
begin
  select g.id, g.logement_id, g.scope
  into v_grant
  from public.logement_access_grants g
  where g.token = p_token
    and g.revoked_at is null
    and g.expires_at > now();

  if not found then
    return;
  end if;

  if v_grant.scope = 'total' then
    return query
    select i.id, i.type_travaux, i.date_intervention, i.artisan_siret, i.rge_verifie, i.rge_verifie_a
    from public.interventions i
    where i.logement_id = v_grant.logement_id
    order by i.date_intervention desc;
  else
    return query
    select i.id, i.type_travaux, i.date_intervention, i.artisan_siret, i.rge_verifie, i.rge_verifie_a
    from public.interventions i
    join public.logement_access_grant_interventions gi on gi.intervention_id = i.id
    where gi.grant_id = v_grant.id
    order by i.date_intervention desc;
  end if;
end;
$$;

grant execute on function public.list_granted_interventions(uuid) to anon, authenticated;
