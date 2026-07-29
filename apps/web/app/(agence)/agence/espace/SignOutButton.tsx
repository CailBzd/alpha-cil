"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Button } from "@alpha-cil/ui";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/agence/connexion");
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut}>
      Se déconnecter
    </Button>
  );
}
