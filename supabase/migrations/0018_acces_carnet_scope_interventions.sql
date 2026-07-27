-- The insert policy on logement_access_grant_interventions only checked
-- that the GRANT belonged to the caller's own logement — never that the
-- INTERVENTION being attached also belongs to that same logement. A
-- crafted request (not reachable from the app's own UI, but reachable via
-- a direct API call) could attach another owner's intervention_id to a
-- grant on one's own logement, and a 'partiel' consultation link would
-- then leak that other logement's intervention to the tiers.
drop policy "logement_access_grant_interventions_insert_owner" on public.logement_access_grant_interventions;

create policy "logement_access_grant_interventions_insert_owner" on public.logement_access_grant_interventions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.logement_access_grants g
      join public.logements l on l.id = g.logement_id
      where g.id = logement_access_grant_interventions.grant_id
        and l.proprietaire_id = auth.uid()
    )
    and exists (
      select 1
      from public.logement_access_grants g
      join public.interventions i on i.logement_id = g.logement_id
      where g.id = logement_access_grant_interventions.grant_id
        and i.id = logement_access_grant_interventions.intervention_id
    )
  );

-- Defense in depth: even if a mismatched row existed already (e.g. one
-- inserted before this fix), never surface it — the 'partiel' branch now
-- re-checks the intervention's own logement_id against the grant's,
-- instead of trusting the join table alone.
drop function public.list_granted_interventions(uuid);

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
      and i.logement_id = v_grant.logement_id
    order by i.date_intervention desc;
  end if;
end;
$$;

grant execute on function public.list_granted_interventions(uuid) to anon, authenticated;
