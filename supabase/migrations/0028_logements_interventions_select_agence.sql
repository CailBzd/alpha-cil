-- A raw `exists (select 1 from logement_access_grants ...)` subquery inside
-- a logements/interventions policy would recurse infinitely: evaluating
-- that subquery re-triggers logement_access_grants' OWN policies (e.g.
-- logement_access_grants_select_owner), which themselves query logements,
-- which re-triggers these policies again. Routing through a SECURITY
-- DEFINER helper avoids the cycle — it runs as the function owner, which
-- bypasses RLS on the tables it queries internally (the same reason
-- validate_access_grant/claim_agence_grant can freely read
-- logement_access_grants without needing a policy for anon/authenticated).
create function public.has_agence_grant(p_logement_id uuid, p_intervention_id uuid default null)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.logement_access_grants g
    where g.logement_id = p_logement_id
      and g.agence_id = auth.uid()
      and g.revoked_at is null
      and g.expires_at > now()
      and (
        p_intervention_id is null
        or g.scope = 'total'
        or exists (
          select 1
          from public.logement_access_grant_interventions gi
          where gi.grant_id = g.id
            and gi.intervention_id = p_intervention_id
        )
      )
  );
$$;

grant execute on function public.has_agence_grant(uuid, uuid) to authenticated;

-- Grants a logged-in, claimed agency direct read access to exactly what the
-- anonymous /consultation?token=... link already exposes to a tiers today —
-- the logement itself and its interventions — nothing from the owner's
-- private planning tools (contacts, rappels, projets/devis, finances).
-- These are additive policies: Postgres ORs all permissive policies for the
-- same command, so this strictly widens access and cannot regress the
-- existing owner (proprietaire_id = auth.uid()) or artisan
-- (artisan_id = auth.uid()) select policies.
create policy "logements_select_agence_grant" on public.logements
  for select
  to authenticated
  using (public.has_agence_grant(logements.id));

create policy "interventions_select_agence_grant" on public.interventions
  for select
  to authenticated
  using (public.has_agence_grant(interventions.logement_id, interventions.id));

-- The agency dashboard itself (listing claimed logements, and reading a
-- single grant's scope to know whether to show adresse/équipements) needs
-- to read its OWN claimed grant rows — the existing select policy on this
-- table is owner-only. Scoped strictly to agence_id = auth.uid(), so an
-- agency can never see another owner's still-unclaimed or someone-else's
-- grants. No recursion risk here: this policy has no cross-table reference.
create policy "logement_access_grants_select_agence" on public.logement_access_grants
  for select
  to authenticated
  using (agence_id = auth.uid());
