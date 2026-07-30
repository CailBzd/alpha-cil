-- Lets an artisan check whether a logement/compte already exists for a
-- given address, without exposing anything else about it (no logement_id,
-- no owner, no intervention history) — a smaller-but-real RGPD exposure
-- than the still-unscoped public/anonymous version, scoped to authenticated
-- professionals only. Same exact-match normalization as
-- match_or_create_logement, kept a boolean-only return at the DB layer
-- (not just trimmed in the API response) so the privacy limit can't be
-- accidentally widened by a future caller.
create function public.logement_exists_for_adresse(p_adresse text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.logements l
    where lower(trim(l.adresse)) = lower(trim(p_adresse))
  );
$$;

-- Postgres grants EXECUTE to PUBLIC by default on function creation, which
-- would let the anon key call this directly via PostgREST, bypassing the
-- Next.js route's auth + artisan-role check entirely. Existing functions
-- like match_or_create_logement inherited that same default and it went
-- unnoticed since nothing sensitive hinges on it; here the whole point is
-- restricting this address-existence check to authenticated professionals
-- (an explicit RGPD-scoping decision), so the default grant is revoked.
revoke execute on function public.logement_exists_for_adresse(text) from public;
grant execute on function public.logement_exists_for_adresse(text) to authenticated;
