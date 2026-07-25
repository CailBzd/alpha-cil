import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { SignOutButton } from "./SignOutButton";

export default async function EspaceArtisanPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      for (const { name, value, options } of cookiesToSet) {
        cookieStore.set(name, value, options);
      }
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <header>
        <span>Alpha CIL</span>
        <span>{user?.email}</span>
        <SignOutButton />
      </header>
      <div>
        <nav>
          <a href="/artisan/espace">Mes interventions</a>
        </nav>
        <main>
          <h1>Bienvenue</h1>
          <p>Soumettez votre première intervention pour commencer.</p>
        </main>
      </div>
    </div>
  );
}
