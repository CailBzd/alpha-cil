-- Performance audit (2026-07-31) finding: none of the 33 prior migrations
-- ever added an index on a foreign key, and nearly every RLS policy and
-- app query filters by one of these — invisible at today's near-zero
-- traffic, but every one forces a sequential scan as soon as any logement
-- accumulates a normal multi-year history. Postgres never indexes a
-- foreign key automatically (only primary keys and unique constraints
-- get one), so this has to be explicit.
create index if not exists interventions_artisan_id_idx on public.interventions (artisan_id);
create index if not exists interventions_logement_id_idx on public.interventions (logement_id);
create index if not exists logements_proprietaire_id_idx on public.logements (proprietaire_id);
create index if not exists logement_invitations_logement_id_idx on public.logement_invitations (logement_id);
create index if not exists logement_access_grants_logement_id_idx on public.logement_access_grants (logement_id);
create index if not exists logement_access_grants_agence_id_idx on public.logement_access_grants (agence_id);
-- grant_id is already indexed as the leading column of this table's
-- composite primary key; only the reverse lookup direction needs one.
create index if not exists logement_access_grant_interventions_intervention_id_idx
  on public.logement_access_grant_interventions (intervention_id);
create index if not exists contacts_proprietaire_id_idx on public.contacts (proprietaire_id);
create index if not exists rappels_logement_id_idx on public.rappels (logement_id);
create index if not exists rappels_contact_id_idx on public.rappels (contact_id);
create index if not exists projets_logement_id_idx on public.projets (logement_id);
create index if not exists devis_projet_id_idx on public.devis (projet_id);
create index if not exists devis_contact_id_idx on public.devis (contact_id);
create index if not exists rendez_vous_logement_id_idx on public.rendez_vous (logement_id);
create index if not exists rendez_vous_contact_id_idx on public.rendez_vous (contact_id);
create index if not exists rendez_vous_artisan_id_idx on public.rendez_vous (artisan_id);
