-- Scheduled appointments (item #13's calendar feature) — deliberately its
-- own table rather than an extension of interventions. interventions has
-- never had an UPDATE policy and models a *completed, invoiced* job
-- (montant_euros mandatory, date_intervention drives the RGE-at-that-date
-- check); a provisional/bidirectionally-editable rendez-vous is a
-- different concept, and retrofitting one onto the other would be the
-- first UPDATE policy ever added to a table three other features already
-- depend on being append-only.
create type public.rendez_vous_statut as enum ('provisoire', 'validee');
create type public.rendez_vous_modificateur as enum ('proprietaire', 'artisan');

create table public.rendez_vous (
  id uuid primary key default gen_random_uuid(),
  logement_id uuid not null references public.logements (id) on delete cascade,
  -- Denormalized at creation time, same reason interventions.adresse_logement
  -- exists: an artisan has no RLS read access to logements at all (only
  -- their own interventions/rendez_vous rows), so this is the only way
  -- they can see which address a linked rendez-vous is for.
  adresse_logement text,
  type_travaux text not null,
  date_prevue date not null,
  statut public.rendez_vous_statut not null default 'provisoire',
  contact_id uuid references public.contacts (id) on delete set null,
  artisan_id uuid references public.artisans (id) on delete set null,
  artisan_email text,
  notes text,
  derniere_modification_par public.rendez_vous_modificateur not null default 'proprietaire',
  derniere_modification_a timestamptz,
  created_at timestamptz not null default now()
);

alter table public.rendez_vous enable row level security;

grant select, insert, update, delete on public.rendez_vous to authenticated;

create policy "rendez_vous_select_owner" on public.rendez_vous
  for select
  to authenticated
  using (
    exists (
      select 1 from public.logements l
      where l.id = rendez_vous.logement_id and l.proprietaire_id = auth.uid()
    )
  );

create policy "rendez_vous_insert_owner" on public.rendez_vous
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.logements l
      where l.id = rendez_vous.logement_id and l.proprietaire_id = auth.uid()
    )
  );

create policy "rendez_vous_update_owner" on public.rendez_vous
  for update
  to authenticated
  using (
    exists (
      select 1 from public.logements l
      where l.id = rendez_vous.logement_id and l.proprietaire_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.logements l
      where l.id = rendez_vous.logement_id and l.proprietaire_id = auth.uid()
    )
  );

create policy "rendez_vous_delete_owner" on public.rendez_vous
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.logements l
      where l.id = rendez_vous.logement_id and l.proprietaire_id = auth.uid()
    )
  );

-- Once linked (artisan_id set — see link_rendez_vous_artisan below), the
-- artisan can also read and update their own rendez-vous. Single-column
-- check, no cross-table reference, no recursion risk.
create policy "rendez_vous_select_artisan" on public.rendez_vous
  for select
  to authenticated
  using (artisan_id = auth.uid());

create policy "rendez_vous_update_artisan" on public.rendez_vous
  for update
  to authenticated
  using (artisan_id = auth.uid())
  with check (artisan_id = auth.uid());

-- Agencies see rendez-vous only under a 'total' grant — deliberately NOT
-- the existing has_agence_grant(logement_id, null) shape used for
-- logements/interventions, whose null-intervention-id branch short-
-- circuits true even under a 'partiel' grant. A 'partiel' grant means
-- "only these specific past interventions I picked," not "also see all
-- upcoming appointments," so this needs its own, stricter helper.
create function public.has_agence_grant_total(p_logement_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.logement_access_grants g
    where g.logement_id = p_logement_id
      and g.agence_id = auth.uid()
      and g.revoked_at is null
      and g.expires_at > now()
      and g.scope = 'total'
  );
$$;

grant execute on function public.has_agence_grant_total(uuid) to authenticated;

create policy "rendez_vous_select_agence_grant" on public.rendez_vous
  for select
  to authenticated
  using (public.has_agence_grant_total(rendez_vous.logement_id));

-- Links a rendez-vous to an existing artisan account by email. No token/
-- claim ceremony needed (unlike the agency invitation flow): the owner
-- already vetted the email by typing it themselves and re-proves
-- ownership of the row on every call; the match key (auth.users.email,
-- unique) can't be spoofed by a different artisan account. auth.users has
-- no policy exposing it to a plain authenticated client, hence the
-- security definer function (same reason claim_agence_grant needs one).
create function public.link_rendez_vous_artisan(p_rendez_vous_id uuid, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_ok boolean;
  v_artisan_id uuid;
begin
  select exists (
    select 1
    from public.rendez_vous r
    join public.logements l on l.id = r.logement_id
    where r.id = p_rendez_vous_id and l.proprietaire_id = auth.uid()
  ) into v_owner_ok;

  if not v_owner_ok then
    return 'not_owner';
  end if;

  select a.id into v_artisan_id
  from public.artisans a
  join auth.users u on u.id = a.id
  where lower(u.email) = lower(p_email);

  update public.rendez_vous
  set artisan_email = p_email, artisan_id = v_artisan_id
  where id = p_rendez_vous_id;

  return case when v_artisan_id is null then 'no_account' else 'linked' end;
end;
$$;

grant execute on function public.link_rendez_vous_artisan(uuid, text) to authenticated;

-- When the artisan makes a change, the route handler needs the owner's
-- email to notify them (the reverse direction — notifying an already-
-- linked artisan — just reads the row's own artisan_email column, no
-- function needed). auth.users is never directly readable by an
-- authenticated client, hence this function; scoped to only return
-- anything when the caller is genuinely the linked artisan or the owner
-- of this same row, so it can't be used to look up an arbitrary owner's
-- email.
create function public.get_rendez_vous_owner_email(p_rendez_vous_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_caller_ok boolean;
begin
  select l.proprietaire_id into v_owner_id
  from public.rendez_vous r
  join public.logements l on l.id = r.logement_id
  where r.id = p_rendez_vous_id;

  if v_owner_id is null then
    return null;
  end if;

  select exists (
    select 1 from public.rendez_vous r
    where r.id = p_rendez_vous_id
      and (r.artisan_id = auth.uid() or v_owner_id = auth.uid())
  ) into v_caller_ok;

  if not v_caller_ok then
    return null;
  end if;

  return (select email from auth.users where id = v_owner_id);
end;
$$;

grant execute on function public.get_rendez_vous_owner_email(uuid) to authenticated;
