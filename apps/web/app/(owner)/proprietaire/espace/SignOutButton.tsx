"use client";

import { createBrowserSupabaseClient } from "@foya/db";
import { Button } from "@foya/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSignOut() {
    setSubmitting(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/proprietaire/connexion");
  }

  return (
    <Button variant="ghost" size="sm" loading={submitting} onClick={handleSignOut}>
      Se déconnecter
    </Button>
  );
}
