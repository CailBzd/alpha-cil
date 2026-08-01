-- Generic freemium tier primitive: row absence = "gratuit", row presence =
-- "payant". Mirrors resolvePersona's own row-existence idiom
-- (apps/web/lib/persona.ts: a row in artisans/agences = that persona,
-- absence = proprietaire default) rather than an enum column, since that's
-- this codebase's established pattern for "kind of user".
--
-- No billing integration exists yet, so there is deliberately no insert/
-- update/delete grant to authenticated here — only service_role (via
-- createServiceRoleSupabaseClient()) can activate a subscription today,
-- e.g. from a manual admin action or a future Stripe webhook route.
create table public.abonnements_payants (
  user_id uuid primary key references auth.users (id) on delete cascade,
  activated_at timestamptz not null default now()
);

alter table public.abonnements_payants enable row level security;

grant select on public.abonnements_payants to authenticated;

create policy "abonnements_payants_select_self" on public.abonnements_payants
  for select
  to authenticated
  using (auth.uid() = user_id);
