"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { Button } from "@alpha-cil/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RevokeButton({ grantId }: { grantId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleRevoke() {
    setSubmitting(true);
    const supabase = createBrowserSupabaseClient();
    await supabase
      .from("logement_access_grants")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", grantId);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" loading={submitting} onClick={handleRevoke}>
      Révoquer
    </Button>
  );
}
