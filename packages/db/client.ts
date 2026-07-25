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
  // Next.js only inlines NEXT_PUBLIC_ vars into the browser bundle when they
  // are referenced as a static `process.env.NEXT_PUBLIC_X` access; going
  // through requireEnv's dynamic `process.env[name]` defeats that inlining
  // and leaves these undefined at runtime in the browser.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!anonKey) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createBrowserClient(url, anonKey);
}

export function createServerSupabaseClient(cookies: ServerCookieAdapter): SupabaseClient {
  return createServerClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_ANON_KEY"),
    { cookies },
  );
}
