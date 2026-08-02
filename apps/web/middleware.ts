import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  let cookiesToApply: { name: string; value: string; options: CookieOptions }[] = [];

  // Inlined rather than imported from @alpha-cil/db/server: Vercel's Edge
  // Function bundler fails to trace across the workspace package boundary
  // (its exports map points at raw .ts source), so this file must be
  // self-contained with no cross-package import for the Edge runtime.
  const supabase = createServerClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        cookiesToApply = cookiesToSet;
      },
    },
  });

  // Refreshes the session and is the ONLY place that calls the Supabase Auth
  // server per request — every layout under (owner)/(artisan)/(agence) used
  // to call auth.getUser() again itself, paying for a second network
  // round-trip to re-validate the same JWT on every single navigation. The
  // validated identity is relayed downstream via request headers instead
  // (below), which .set() overwrites unconditionally, so a client-supplied
  // header of the same name can never survive past this point.
  //
  // This does NOT move access control into the middleware: which persona a
  // route requires and which rows a query may touch are still decided by
  // each route and by RLS respectively, exactly as before.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  requestHeaders.set("x-alpha-cil-user-id", user?.id ?? "");
  requestHeaders.set("x-alpha-cil-user-email", user?.email ?? "");

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const { name, value, options } of cookiesToApply) {
    response.cookies.set(name, value, options);
  }

  return response;
}

export const config = {
  matcher: ["/artisan/espace/:path*", "/proprietaire/espace/:path*", "/agence/espace/:path*"],
};
