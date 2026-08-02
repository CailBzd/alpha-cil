import { createServerSupabaseClient } from "@foya/db";
import { cookies } from "next/headers";

// Replaces the ~10-line cookies()+createServerSupabaseClient(...) adapter
// that was copy-pasted verbatim across 34+ route handlers/layouts/server
// pages (code-quality audit finding, 2026-07-31). The try/catch is a no-op
// in Route Handlers (where cookie writes succeed) and the documented
// escape hatch in Server Components (which can't write cookies — see
// middleware.ts, which refreshes the session and writes fresh cookies on
// every request instead).
export async function getServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Server Components can't write cookies; middleware.ts already
        // refreshes the session and writes fresh cookies on every request,
        // so a write attempted here is safe to ignore.
      }
    },
  });
}
