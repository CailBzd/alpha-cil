-- The address and client email an artisan supplies at submission, the
-- logement it resolved to (never set for an ambiguous match), and whether
-- that resolution was ambiguous and needs manual attention.
alter table public.interventions
  add column adresse_logement text not null,
  add column email_client text not null,
  add column logement_id uuid references public.logements (id),
  add column rattachement_ambigu boolean not null default false;

-- Only known once an artisan's intervention supplies it; kept on the
-- logement itself so any future intervention for the same (still
-- unclaimed) address can refresh the notification target.
alter table public.logements
  add column contact_email text;

-- Finds or creates the logement for an intervention's address, entirely
-- bypassing the owner-scoped `logements` RLS policy: an artisan legitimately
-- needs to search/create across ALL logements, not just one they own (they
-- own none). Centralizing that elevated access in one auditable function is
-- the model INSTALL.md documents for this access pattern, instead of
-- widening the RLS policy itself.
create function public.match_or_create_logement(
  p_adresse text,
  p_contact_email text
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
    insert into public.logements (adresse, contact_email)
    values (p_adresse, p_contact_email)
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

  update public.logements set contact_email = p_contact_email where id = v_logement_id;

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

grant execute on function public.match_or_create_logement(text, text) to authenticated;
