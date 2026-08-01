-- AI-generated devis comparison (Mistral), scoped per projet. This table
-- doubles as both the quota ledger (its created_at rows are what's
-- counted by peut_lancer_analyse_ia below) and a result cache (the last
-- analysis is shown on page load without re-calling the paid API).
create table public.projet_analyses_ia (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references public.projets (id) on delete cascade,
  contenu text not null,
  modele text not null,
  created_at timestamptz not null default now()
);

alter table public.projet_analyses_ia enable row level security;

grant select, insert on public.projet_analyses_ia to authenticated;

create policy "projet_analyses_ia_select_owner" on public.projet_analyses_ia
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projets p
      join public.logements l on l.id = p.logement_id
      where p.id = projet_analyses_ia.projet_id
        and l.proprietaire_id = auth.uid()
    )
  );

create policy "projet_analyses_ia_insert_owner" on public.projet_analyses_ia
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.projets p
      join public.logements l on l.id = p.logement_id
      where p.id = projet_analyses_ia.projet_id
        and l.proprietaire_id = auth.uid()
    )
  );

-- Quota gate consuming the freemium tier primitive (0037_abonnements_
-- payants.sql): gratuit = usable once ever per projet, payant = once per
-- rolling 24h. Expressed as one SECURITY DEFINER function so the rule
-- lives once in SQL — and so the check-then-decide happens in a single
-- round trip, closing the double-click race a naive
-- check-then-insert-from-the-route-handler would leave open.
create function public.peut_lancer_analyse_ia(p_projet_id uuid)
returns table (autorise boolean, raison text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_owner boolean;
  v_payant boolean;
  v_derniere_analyse timestamptz;
begin
  select exists (
    select 1
    from public.projets p
    join public.logements l on l.id = p.logement_id
    where p.id = p_projet_id and l.proprietaire_id = auth.uid()
  ) into v_is_owner;

  if not v_is_owner then
    return query select false, 'forbidden'::text;
    return;
  end if;

  select exists (
    select 1 from public.abonnements_payants where user_id = auth.uid()
  ) into v_payant;

  select max(created_at) into v_derniere_analyse
  from public.projet_analyses_ia
  where projet_id = p_projet_id;

  if v_derniere_analyse is null then
    return query select true, null::text;
    return;
  end if;

  if v_payant then
    if v_derniere_analyse <= now() - interval '24 hours' then
      return query select true, null::text;
    else
      return query select false, 'quota_depasse'::text;
    end if;
    return;
  end if;

  return query select false, 'quota_depasse'::text;
end;
$$;

grant execute on function public.peut_lancer_analyse_ia(uuid) to authenticated;
