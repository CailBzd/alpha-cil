-- Optional estimated/actual duration of an intervention, in decimal hours.
-- Explicitly nullable: neither the owner's nor the artisan's entry form
-- requires it (per user request, this must not become mandatory).
alter table public.interventions
  add column duree_heures numeric(5, 2) check (duree_heures is null or duree_heures > 0);
