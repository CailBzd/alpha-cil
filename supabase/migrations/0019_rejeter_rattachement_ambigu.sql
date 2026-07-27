-- The submission route now rejects an ambiguous address before creating
-- any intervention (400 adresse_ambigue), instead of storing an orphaned
-- row flagged for a resolution that never existed. rattachement_ambigu can
-- no longer be set true by any write path, so the column is dead.
alter table public.interventions
  drop column rattachement_ambigu;
