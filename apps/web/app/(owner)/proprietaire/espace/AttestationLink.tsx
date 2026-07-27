"use client";

import { createBrowserSupabaseClient } from "@alpha-cil/db";
import { useState } from "react";

export function AttestationLink({ path }: { path: string }) {
  const [error, setError] = useState(false);

  async function handleClick() {
    setError(false);
    const supabase = createBrowserSupabaseClient();
    const { data, error: signError } = await supabase.storage
      .from("artisans")
      .createSignedUrl(path, 60);

    if (signError || !data) {
      setError(true);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="underline underline-offset-4 text-muted-foreground"
      >
        Voir l&apos;attestation
      </button>
      {error ? <span className="text-destructive"> — impossible d&apos;ouvrir le fichier.</span> : null}
    </>
  );
}
