-- DPE (Diagnostic de Performance Énergétique) classes, imported automatically
-- from the ADEME dataset when available (US-08); absence never blocks fiche
-- creation.
alter table public.logements
  add column dpe_classe_energie text,
  add column dpe_classe_ges text;

-- Lets an authenticated propriétaire create their own fiche from an address,
-- or claim one already created (unclaimed) by an earlier artisan
-- intervention — without a broad RLS policy exposing every logement to
-- every propriétaire. Mirrors the caution already applied in
-- match_or_create_logement (US-04): never attaches a fiche that is
-- ambiguous or already owned by someone else.
create function public.create_logement_from_adresse(
  p_adresse text,
  p_dpe_classe_energie text,
  p_dpe_classe_ges text
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
    insert into public.logements (adresse, proprietaire_id, dpe_classe_energie, dpe_classe_ges)
    values (p_adresse, auth.uid(), p_dpe_classe_energie, p_dpe_classe_ges)
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
    dpe_classe_ges = coalesce(dpe_classe_ges, p_dpe_classe_ges)
  where id = v_logement_id;

  return query select v_logement_id, false, true;
end;
$$;

grant execute on function public.create_logement_from_adresse(text, text, text) to authenticated;
