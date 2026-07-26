import { createServerSupabaseClient } from "@alpha-cil/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerSupabaseClient({
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
  });

  // Refresh the session only. Access control is enforced by each route
  // itself (see apps/web/app/(artisan)/artisan/espace/page.tsx and
  // apps/web/app/(owner)/proprietaire/espace/page.tsx), never here.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/artisan/espace/:path*", "/proprietaire/espace/:path*"],
};
