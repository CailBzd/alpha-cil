import { createServerClient } from "@supabase/ssr";
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
  let response = NextResponse.next({ request });

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
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh the session only. Access control is enforced by each route
  // itself (see apps/web/app/(artisan)/artisan/espace/page.tsx and
  // apps/web/app/(owner)/proprietaire/espace/page.tsx), never here.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/artisan/espace/:path*", "/proprietaire/espace/:path*", "/agence/espace/:path*"],
};
