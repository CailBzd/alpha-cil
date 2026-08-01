import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./require-env";

// For system-wide operations with no user session (e.g. the maintenance
// reminders cron): bypasses RLS entirely, never used to act on a user's
// behalf. Node-only (imports @supabase/supabase-js directly) — never used
// from an Edge Function, only regular Node.js Route Handlers.
export function createServiceRoleSupabaseClient(): SupabaseClient {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
