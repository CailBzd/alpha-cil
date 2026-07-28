import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppHeader } from "../../../../AppHeader";
import { ThemeToggle } from "../../../../theme-toggle";
import { SignOutButton } from "../SignOutButton";
import { DecennaleForm } from "./DecennaleForm";

export default async function ProfilArtisanPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Server Components can't write cookies. middleware.ts refreshes
        // the session and writes fresh cookies on every request, so a
        // write attempted here is safe to ignore.
      }
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/artisan/connexion");
  }

  const { data: artisan } = await supabase
    .from("artisans")
    .select("attestation_decennale_uploaded_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader>
        <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
        <ThemeToggle />
        <SignOutButton />
      </AppHeader>
      <main className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mon profil</h1>
        <div className="mt-6">
          <DecennaleForm uploadedAt={artisan?.attestation_decennale_uploaded_at ?? null} />
        </div>
      </main>
    </div>
  );
}
