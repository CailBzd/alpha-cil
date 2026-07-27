-- One reference date and one "already notified" marker per equipment that
-- needs scheduled maintenance. The marker is reset to null by the owner's
-- own update whenever the reference date changes (new cycle, new due date).
alter table public.logements
  add column derniere_verif_chauffage date,
  add column rappel_chauffage_envoye_a timestamptz,
  add column derniere_verif_vmc date,
  add column rappel_vmc_envoye_a timestamptz;

-- Finds logements due for a maintenance reminder: an equipment that needs
-- one (gaz/bois heating, any VMC) has a reference date, no reminder sent
-- yet for the current cycle, and its 1-year due date falls within 30 days.
-- SECURITY DEFINER to reach auth.users for the notification email (that
-- schema isn't exposed to PostgREST at all, cf. supabase/config.toml).
-- Postgres grants EXECUTE to PUBLIC by default, which would otherwise let
-- any authenticated user call this directly and harvest every owner's
-- email — explicitly revoked below, granted only to service_role.
create function public.logements_a_notifier_entretien()
returns table (
  logement_id uuid,
  proprietaire_email text,
  chauffage_du boolean,
  chauffage_echeance date,
  vmc_du boolean,
  vmc_echeance date
)
language sql
security definer
set search_path = public
as $$
  select
    l.id,
    u.email,
    (l.chauffage_type in ('gaz', 'bois')
      and l.derniere_verif_chauffage is not null
      and l.rappel_chauffage_envoye_a is null
      and l.derniere_verif_chauffage + interval '1 year' <= now() + interval '30 days'),
    (l.derniere_verif_chauffage + interval '1 year')::date,
    (l.vmc_type in ('simple_flux', 'double_flux')
      and l.derniere_verif_vmc is not null
      and l.rappel_vmc_envoye_a is null
      and l.derniere_verif_vmc + interval '1 year' <= now() + interval '30 days'),
    (l.derniere_verif_vmc + interval '1 year')::date
  from public.logements l
  join auth.users u on u.id = l.proprietaire_id
  where l.proprietaire_id is not null
    and (
      (l.chauffage_type in ('gaz', 'bois')
        and l.derniere_verif_chauffage is not null
        and l.rappel_chauffage_envoye_a is null
        and l.derniere_verif_chauffage + interval '1 year' <= now() + interval '30 days')
      or
      (l.vmc_type in ('simple_flux', 'double_flux')
        and l.derniere_verif_vmc is not null
        and l.rappel_vmc_envoye_a is null
        and l.derniere_verif_vmc + interval '1 year' <= now() + interval '30 days')
    );
$$;

revoke execute on function public.logements_a_notifier_entretien() from public;
grant execute on function public.logements_a_notifier_entretien() to service_role;
