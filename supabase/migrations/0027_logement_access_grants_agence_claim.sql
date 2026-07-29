-- Upgrades a logement_access_grant from a bare anonymous token link into
-- something an authenticated, SIRET-verified agency account can claim and
-- keep read access through. agence_id stays null until claimed; a grant
-- with tiers_type = 'autre' is never expected to have one.
alter table public.logement_access_grants
  add column agence_id uuid references public.agences (id) on delete set null;

-- Atomically links the calling agency's account to a grant addressed to
-- their own email. security definer + `for update` locks the grant row so
-- two near-simultaneous claims (e.g. two browser tabs) can't both pass the
-- agence_id-is-null check before either writes. Re-claiming the same grant
-- by the same rightful agency is an idempotent no-op success; a grant
-- already claimed by a *different* agency is a hard rejection
-- (claimed_by_other) — never silently ignored or overwritten, since the
-- token alone must not be enough to hijack another agency's access (the
-- same defensive posture as the cross-tenant fix in migration 0018).
--
-- The caller's email is read fresh from auth.users via auth.uid() inside
-- this security definer function, rather than trusted from the JWT
-- (auth.jwt() ->> 'email'), since a JWT minted at login can go stale if the
-- user's email changes mid-session.
create function public.claim_agence_grant(p_token uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant record;
  v_caller_email text;
begin
  select email into v_caller_email from auth.users where id = auth.uid();

  select *
  into v_grant
  from public.logement_access_grants
  where token = p_token
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_grant.tiers_type <> 'agence' then
    return 'wrong_type';
  end if;

  if v_grant.revoked_at is not null or v_grant.expires_at <= now() then
    return 'expired_or_revoked';
  end if;

  if lower(v_grant.tiers_email) <> lower(v_caller_email) then
    return 'email_mismatch';
  end if;

  if v_grant.agence_id is not null and v_grant.agence_id <> auth.uid() then
    return 'claimed_by_other';
  end if;

  update public.logement_access_grants set agence_id = auth.uid() where id = v_grant.id;

  return 'success';
end;
$$;

grant execute on function public.claim_agence_grant(uuid) to authenticated;

-- Lets an unauthenticated visitor preview an agency invitation (the tiers
-- email it was addressed to, and the logement's address, for a friendlier
-- "you've been invited for this address" message) before signing up or
-- logging in — same shape as preview_logement_invitation (0004_logements.sql),
-- kept as its own function since that one's return shape has no tiers_email
-- and serves an unrelated invitation type (an owner claiming their own
-- logement, not an agency claiming read access to someone else's).
create function public.preview_agence_grant(p_token uuid)
returns table (tiers_email text, adresse text, valid boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select g.tiers_email,
         l.adresse,
         (g.tiers_type = 'agence' and g.revoked_at is null and g.expires_at > now())
  from public.logement_access_grants g
  join public.logements l on l.id = g.logement_id
  where g.token = p_token;
end;
$$;

grant execute on function public.preview_agence_grant(uuid) to anon, authenticated;
