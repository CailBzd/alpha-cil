-- The reminders cron marks a logement as notified with a direct table
-- update via the service-role client (bypassing RLS is not enough on its
-- own: Postgres still requires a table-level grant for that role).
grant select, update on public.logements to service_role;
