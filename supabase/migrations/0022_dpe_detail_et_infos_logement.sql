-- Full DPE detail (consommation, émissions, date du diagnostic) beyond the
-- two-letter classes already stored, plus a first pass of richer property
-- details (surface auto-filled from the same ADEME lookup, nombre de
-- pièces/année de construction entered manually since ADEME doesn't have
-- them). Feature request #4.
alter table public.logements
  add column dpe_consommation numeric,
  add column dpe_emissions numeric,
  add column dpe_date_diagnostic date,
  add column surface_habitable numeric,
  add column nombre_pieces integer,
  add column annee_construction integer;

-- The DPE detail is wanted by the artisan too, but they have no read access
-- to logements at all today (US-09 deliberately avoided widening that
-- surface for the owner's email). Denormalizing onto the intervention row
-- — the same trick already used for artisan_siret/attestation_decennale —
-- keeps that boundary intact: the artisan reads their own interventions
-- row, nothing new to grant on logements.
alter table public.interventions
  add column dpe_classe_energie text,
  add column dpe_classe_ges text,
  add column dpe_consommation numeric,
  add column dpe_emissions numeric,
  add column dpe_date_diagnostic date;

-- nombre_pieces/annee_construction need no new RLS: logements_update_owner
-- (0011_acces_carnet.sql) is a row-level policy, so it already covers any
-- column the owner writes.

drop function if exists public.create_logement_from_adresse(text, text, text);

create function public.create_logement_from_adresse(
  p_adresse text,
  p_dpe_classe_energie text,
  p_dpe_classe_ges text,
  p_dpe_consommation numeric,
  p_dpe_emissions numeric,
  p_dpe_date_diagnostic date,
  p_surface_habitable numeric
)
returns table (
  logement_id uuid,
  created boolean,
  success boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_count integer;
  v_logement_id uuid;
  v_proprietaire_id uuid;
begin
  select count(*) into v_match_count
  from public.logements l
  where lower(trim(l.adresse)) = lower(trim(p_adresse));

  if v_match_count > 1 then
    return query select null::uuid, false, false;
    return;
  end if;

  if v_match_count = 0 then
    insert into public.logements (
      adresse, proprietaire_id, dpe_classe_energie, dpe_classe_ges,
      dpe_consommation, dpe_emissions, dpe_date_diagnostic, surface_habitable
    )
    values (
      p_adresse, auth.uid(), p_dpe_classe_energie, p_dpe_classe_ges,
      p_dpe_consommation, p_dpe_emissions, p_dpe_date_diagnostic, p_surface_habitable
    )
    returning id into v_logement_id;

    return query select v_logement_id, true, true;
    return;
  end if;

  select l.id, l.proprietaire_id into v_logement_id, v_proprietaire_id
  from public.logements l
  where lower(trim(l.adresse)) = lower(trim(p_adresse));

  if v_proprietaire_id is not null and v_proprietaire_id <> auth.uid() then
    return query select null::uuid, false, false;
    return;
  end if;

  update public.logements
  set
    proprietaire_id = auth.uid(),
    dpe_classe_energie = coalesce(dpe_classe_energie, p_dpe_classe_energie),
    dpe_classe_ges = coalesce(dpe_classe_ges, p_dpe_classe_ges),
    dpe_consommation = coalesce(dpe_consommation, p_dpe_consommation),
    dpe_emissions = coalesce(dpe_emissions, p_dpe_emissions),
    dpe_date_diagnostic = coalesce(dpe_date_diagnostic, p_dpe_date_diagnostic),
    surface_habitable = coalesce(surface_habitable, p_surface_habitable)
  where id = v_logement_id;

  return query select v_logement_id, false, true;
end;
$$;

grant execute on function public.create_logement_from_adresse(
  text, text, text, numeric, numeric, date, numeric
) to authenticated;

-- match_or_create_logement (the artisan-initiated path, US-04) never looked
-- up DPE at all — a logement created this way had no ADEME data until an
-- owner separately visited /proprietaire/espace and it was already claimed
-- (create_logement_from_adresse's own-address branch only fires for an
-- unclaimed fiche). Bringing it in line with the owner-initiated path.
drop function if exists public.match_or_create_logement(text, text);

create function public.match_or_create_logement(
  p_adresse text,
  p_contact_email text,
  p_dpe_classe_energie text,
  p_dpe_classe_ges text,
  p_dpe_consommation numeric,
  p_dpe_emissions numeric,
  p_dpe_date_diagnostic date,
  p_surface_habitable numeric
)
returns table (
  logement_id uuid,
  created boolean,
  ambiguous boolean,
  invitation_token uuid,
  notify_email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_count integer;
  v_logement_id uuid;
  v_proprietaire_id uuid;
  v_invitation_token uuid;
  v_notify_email text;
begin
  select count(*) into v_match_count
  from public.logements l
  where lower(trim(l.adresse)) = lower(trim(p_adresse));

  if v_match_count > 1 then
    return query select null::uuid, false, true, null::uuid, null::text;
    return;
  end if;

  if v_match_count = 0 then
    insert into public.logements (
      adresse, contact_email, dpe_classe_energie, dpe_classe_ges,
      dpe_consommation, dpe_emissions, dpe_date_diagnostic, surface_habitable
    )
    values (
      p_adresse, p_contact_email, p_dpe_classe_energie, p_dpe_classe_ges,
      p_dpe_consommation, p_dpe_emissions, p_dpe_date_diagnostic, p_surface_habitable
    )
    returning id into v_logement_id;

    insert into public.logement_invitations (logement_id, expires_at)
    values (v_logement_id, now() + interval '30 days')
    returning token into v_invitation_token;

    return query select v_logement_id, true, false, v_invitation_token, p_contact_email;
    return;
  end if;

  select l.id, l.proprietaire_id into v_logement_id, v_proprietaire_id
  from public.logements l
  where lower(trim(l.adresse)) = lower(trim(p_adresse));

  if v_proprietaire_id is not null then
    select u.email into v_notify_email from auth.users u where u.id = v_proprietaire_id;
    return query select v_logement_id, false, false, null::uuid, v_notify_email;
    return;
  end if;

  update public.logements
  set
    contact_email = p_contact_email,
    dpe_classe_energie = coalesce(dpe_classe_energie, p_dpe_classe_energie),
    dpe_classe_ges = coalesce(dpe_classe_ges, p_dpe_classe_ges),
    dpe_consommation = coalesce(dpe_consommation, p_dpe_consommation),
    dpe_emissions = coalesce(dpe_emissions, p_dpe_emissions),
    dpe_date_diagnostic = coalesce(dpe_date_diagnostic, p_dpe_date_diagnostic),
    surface_habitable = coalesce(surface_habitable, p_surface_habitable)
  where id = v_logement_id;

  select i.token into v_invitation_token
  from public.logement_invitations i
  where i.logement_id = v_logement_id
    and i.used_at is null
    and i.expires_at > now()
  order by i.created_at desc
  limit 1;

  if v_invitation_token is null then
    insert into public.logement_invitations (logement_id, expires_at)
    values (v_logement_id, now() + interval '30 days')
    returning token into v_invitation_token;
  end if;

  return query select v_logement_id, false, false, v_invitation_token, p_contact_email;
end;
$$;

grant execute on function public.match_or_create_logement(
  text, text, text, text, numeric, numeric, date, numeric
) to authenticated;
