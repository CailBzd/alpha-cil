import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Placeholder pass-through. Phase 3 (connexion et espace artisan) extends this
// to refresh the Supabase session and gate the (artisan) route group.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
