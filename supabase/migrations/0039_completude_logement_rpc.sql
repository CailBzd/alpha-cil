-- Artisan growth loop, Phase A: a completeness indicator shown to an
-- artisan on a logement they've worked on ("your work contributed to a
-- carnet that is now X% complete") — a shared-credit framing, since
-- logement-level fields are owner-entered, not artisan-entered.
--
-- Artisans have zero select policy on public.logements today, deliberately
-- (0022_dpe_detail_et_infos_logement.sql's own comment: avoiding widening
-- that surface for the owner's email). This function returns only a
-- number, never the underlying row, preserving that boundary.
create function public.logement_completude_pour_artisan(p_logement_id uuid)
returns table (pourcentage integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_logement record;
  v_total integer := 6; -- type_operation, dpe, surface, pieces, annee, chauffage_type
  v_rempli integer := 0;
begin
  if not exists (
    select 1 from public.interventions
    where logement_id = p_logement_id and artisan_id = auth.uid()
  ) then
    return query select null::integer;
    return;
  end if;

  select * into v_logement from public.logements where id = p_logement_id;

  if not found then
    return query select null::integer;
    return;
  end if;

  if v_logement.type_operation is not null then v_rempli := v_rempli + 1; end if;
  if v_logement.dpe_classe_energie is not null then v_rempli := v_rempli + 1; end if;
  if v_logement.surface_habitable is not null then v_rempli := v_rempli + 1; end if;
  if v_logement.nombre_pieces is not null then v_rempli := v_rempli + 1; end if;
  if v_logement.annee_construction is not null then v_rempli := v_rempli + 1; end if;
  if v_logement.chauffage_type is not null and array_length(v_logement.chauffage_type, 1) > 0 then
    v_rempli := v_rempli + 1;
  end if;

  -- Entretien attestations only count toward the total for equipment the
  -- logement actually has — a home with no gas heating isn't penalized
  -- for having no gas attestation.
  if v_logement.chauffage_type is not null
     and 'gaz'::public.chauffage_type = any(v_logement.chauffage_type) then
    v_total := v_total + 1;
    if v_logement.attestation_entretien_chauffage_gaz_path is not null then
      v_rempli := v_rempli + 1;
    end if;
  end if;

  if v_logement.chauffage_type is not null
     and 'bois'::public.chauffage_type = any(v_logement.chauffage_type) then
    v_total := v_total + 1;
    if v_logement.attestation_entretien_chauffage_bois_path is not null then
      v_rempli := v_rempli + 1;
    end if;
  end if;

  if v_logement.vmc_type::text in ('simple_flux', 'double_flux') then
    v_total := v_total + 1;
    if v_logement.attestation_entretien_vmc_path is not null then
      v_rempli := v_rempli + 1;
    end if;
  end if;

  return query select round((v_rempli::numeric / v_total) * 100)::integer;
end;
$$;

grant execute on function public.logement_completude_pour_artisan(uuid) to authenticated;
