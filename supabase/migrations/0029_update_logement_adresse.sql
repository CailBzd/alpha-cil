-- Lets an owner change their logement's adresse after creation. adresse has
-- no unique DB constraint — create_logement_from_adresse (0022) enforces
-- uniqueness/ambiguity itself in application logic, so an edit path needs
-- the same check (excluding the logement's own row this time) rather than
-- relying on logements_update_owner's plain RLS policy, which has no way
-- to see other rows. DPE fields are replaced outright (not coalesced, as
-- creation does) since a changed address makes the old DPE data wrong.
create function public.update_logement_adresse(
  p_logement_id uuid,
  p_adresse text,
  p_dpe_classe_energie text,
  p_dpe_classe_ges text,
  p_dpe_consommation numeric,
  p_dpe_emissions numeric,
  p_dpe_date_diagnostic date,
  p_surface_habitable numeric
)
returns table (success boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_count integer;
begin
  if not exists (
    select 1 from public.logements
    where id = p_logement_id and proprietaire_id = auth.uid()
  ) then
    return query select false;
    return;
  end if;

  select count(*) into v_match_count
  from public.logements l
  where lower(trim(l.adresse)) = lower(trim(p_adresse))
    and l.id <> p_logement_id;

  if v_match_count > 0 then
    return query select false;
    return;
  end if;

  update public.logements
  set
    adresse = p_adresse,
    dpe_classe_energie = p_dpe_classe_energie,
    dpe_classe_ges = p_dpe_classe_ges,
    dpe_consommation = p_dpe_consommation,
    dpe_emissions = p_dpe_emissions,
    dpe_date_diagnostic = p_dpe_date_diagnostic,
    surface_habitable = p_surface_habitable
  where id = p_logement_id;

  return query select true;
end;
$$;

grant execute on function public.update_logement_adresse(
  uuid, text, text, text, numeric, numeric, date, numeric
) to authenticated;
