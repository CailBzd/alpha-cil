import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./require-env";

interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

interface ServerCookieAdapter {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieToSet[]) => void;
}

// Edge-runtime safe: this file (and its transitive imports) must never pull
// in @supabase/supabase-js's `createClient` at runtime — Next.js middleware
// runs on Vercel's Edge Function runtime, which rejects it. That's why this
// lives in its own module separate from createBrowserSupabaseClient/
// createServiceRoleSupabaseClient (see ./browser.ts, ./service-role.ts).
export function createServerSupabaseClient(cookies: ServerCookieAdapter): SupabaseClient {
  return createServerClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"), {
    cookies,
  });
}
