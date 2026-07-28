-- A logement can have more than one heating type at once (e.g. gaz +
-- bois d'appoint). chauffage_type becomes an array of the existing enum
-- instead of a single value.

-- Gaz (chaudière) and bois (ramonage) are two distinct legal maintenance
-- obligations with independent due dates, so a single derniere_verif/
-- rappel_envoye pair can no longer represent "chauffage" as a whole —
-- split into one pair per trackable sub-type, mirroring the existing VMC
-- columns rather than introducing a new table for just these two.
alter table public.logements
  add column derniere_verif_chauffage_gaz date,
  add column rappel_chauffage_gaz_envoye_a timestamptz,
  add column derniere_verif_chauffage_bois date,
  add column rappel_chauffage_bois_envoye_a timestamptz;

-- Backfill from the old single-chauffage columns before they're dropped,
-- routed to whichever sub-type the logement's current chauffage_type is.
update public.logements
set derniere_verif_chauffage_gaz = derniere_verif_chauffage,
    rappel_chauffage_gaz_envoye_a = rappel_chauffage_envoye_a
where chauffage_type = 'gaz';

update public.logements
set derniere_verif_chauffage_bois = derniere_verif_chauffage,
    rappel_chauffage_bois_envoye_a = rappel_chauffage_envoye_a
where chauffage_type = 'bois';

alter table public.logements
  drop column derniere_verif_chauffage,
  drop column rappel_chauffage_envoye_a;

alter table public.logements
  alter column chauffage_type type public.chauffage_type[]
  using case when chauffage_type is null then null else array[chauffage_type] end;

-- Postgres refuses to CREATE OR REPLACE a function that changes its
-- returned column set, so it must be dropped first (same constraint
-- hit in 0013_tiers_type.sql).
drop function if exists public.validate_access_grant(uuid);

create function public.validate_access_grant(p_token uuid)
returns table (
  logement_id uuid,
  adresse text,
  chauffage_type public.chauffage_type[],
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
    select v_grant.logement_id, null::text, null::public.chauffage_type[], null::public.vmc_type,
           v_grant.scope, v_grant.tiers_type, v_grant.is_valid;
  end if;
end;
$$;

grant execute on function public.validate_access_grant(uuid) to anon, authenticated;

drop function if exists public.logements_a_notifier_entretien();

create function public.logements_a_notifier_entretien()
returns table (
  logement_id uuid,
  proprietaire_email text,
  chauffage_gaz_du boolean,
  chauffage_gaz_echeance date,
  chauffage_bois_du boolean,
  chauffage_bois_echeance date,
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
    ('gaz' = any(l.chauffage_type)
      and l.derniere_verif_chauffage_gaz is not null
      and l.rappel_chauffage_gaz_envoye_a is null
      and l.derniere_verif_chauffage_gaz + interval '1 year' <= now() + interval '30 days'),
    (l.derniere_verif_chauffage_gaz + interval '1 year')::date,
    ('bois' = any(l.chauffage_type)
      and l.derniere_verif_chauffage_bois is not null
      and l.rappel_chauffage_bois_envoye_a is null
      and l.derniere_verif_chauffage_bois + interval '1 year' <= now() + interval '30 days'),
    (l.derniere_verif_chauffage_bois + interval '1 year')::date,
    (l.vmc_type in ('simple_flux', 'double_flux')
      and l.derniere_verif_vmc is not null
      and l.rappel_vmc_envoye_a is null
      and l.derniere_verif_vmc + interval '1 year' <= now() + interval '30 days'),
    (l.derniere_verif_vmc + interval '1 year')::date
  from public.logements l
  join auth.users u on u.id = l.proprietaire_id
  where l.proprietaire_id is not null
    and (
      ('gaz' = any(l.chauffage_type)
        and l.derniere_verif_chauffage_gaz is not null
        and l.rappel_chauffage_gaz_envoye_a is null
        and l.derniere_verif_chauffage_gaz + interval '1 year' <= now() + interval '30 days')
      or
      ('bois' = any(l.chauffage_type)
        and l.derniere_verif_chauffage_bois is not null
        and l.rappel_chauffage_bois_envoye_a is null
        and l.derniere_verif_chauffage_bois + interval '1 year' <= now() + interval '30 days')
      or
      (l.vmc_type in ('simple_flux', 'double_flux')
        and l.derniere_verif_vmc is not null
        and l.rappel_vmc_envoye_a is null
        and l.derniere_verif_vmc + interval '1 year' <= now() + interval '30 days')
    );
$$;

revoke execute on function public.logements_a_notifier_entretien() from public;
grant execute on function public.logements_a_notifier_entretien() to service_role;
