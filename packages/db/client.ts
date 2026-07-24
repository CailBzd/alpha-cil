import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

interface ServerCookieAdapter {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieToSet[]) => void;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function createBrowserSupabaseClient(): SupabaseClient {
  return createBrowserClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

export function createServerSupabaseClient(cookies: ServerCookieAdapter): SupabaseClient {
  return createServerClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_ANON_KEY"),
    { cookies },
  );
}
