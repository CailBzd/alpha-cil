-- Purely presentational: distinguishes which kind of tiers a grant is for
-- (real-estate agency vs. anyone else), with no effect on scope, expiry, or
-- revocation. Defaults to 'autre' so grants already created by US-10 stay
-- valid without a data migration.
alter table public.logement_access_grants
  add column tiers_type text not null default 'autre' check (tiers_type in ('agence', 'autre'));

-- Postgres refuses to CREATE OR REPLACE a function that changes its
-- returned column set (tiers_type is new here), so it must be dropped
-- first.
drop function if exists public.validate_access_grant(uuid);

create function public.validate_access_grant(p_token uuid)
returns table (
  logement_id uuid,
  adresse text,
  chauffage_type public.chauffage_type,
  vmc_type public.vmc_type,
  scope text,
  tiers_type text,
  valid boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant record;
begin
  select g.logement_id, g.scope, g.tiers_type, (g.revoked_at is null and g.expires_at > now()) as is_valid
  into v_grant
  from public.logement_access_grants g
  where g.token = p_token;

  if not found then
    return;
  end if;

  if v_grant.scope = 'total' and v_grant.is_valid then
    return query
    select l.id, l.adresse, l.chauffage_type, l.vmc_type, v_grant.scope, v_grant.tiers_type, v_grant.is_valid
    from public.logements l
    where l.id = v_grant.logement_id;
  else
    return query
    select v_grant.logement_id, null::text, null::public.chauffage_type, null::public.vmc_type,
           v_grant.scope, v_grant.tiers_type, v_grant.is_valid;
  end if;
end;
$$;

grant execute on function public.validate_access_grant(uuid) to anon, authenticated;
