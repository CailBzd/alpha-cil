-- Security audit (2026-07-31) finding: match_or_create_logement is granted
-- to every authenticated user with no caller-role check inside the function
-- body. When an address is already claimed, it returns the real owner's
-- email (v_notify_email) — any signed-up account (propriétaire, agence,
-- artisan) can call this RPC directly via PostgREST, bypassing the
-- artisan-only Next.js route entirely, and harvest another owner's email
-- for any guessed/known address. Same leak class as the one already fixed
-- in 0018_acces_carnet_scope_interventions.sql. Both real call sites
-- (apps/web/app/api/artisan/interventions/route.ts,
-- apps/web/app/api/artisan/invitation/route.ts) are already artisan-only,
-- so restricting the function itself to verified artisans changes no
-- legitimate behavior — mirrors the caller check already used in
-- get_rendez_vous_owner_email (0030_rendez_vous.sql).
create or replace function public.match_or_create_logement(
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
  if not exists (select 1 from public.artisans a where a.id = auth.uid()) then
    return query select null::uuid, false, false, null::uuid, null::text;
    return;
  end if;

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
