"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ConnexionForm } from "../../../ConnexionForm";

const CLAIM_ERROR_MESSAGES: Record<string, string> = {
  wrong_type: "Ce lien d'invitation n'est pas une invitation agence.",
  expired_or_revoked: "Cette invitation a expiré ou a été révoquée.",
  email_mismatch: "Cette invitation a été envoyée à une autre adresse email.",
  claimed_by_other: "Cette invitation a déjà été validée par un autre compte agence.",
  not_found: "Ce lien d'invitation est invalide.",
};

export default function AgenceConnexionPage() {
  async function afterSignIn(supabase: SupabaseClient) {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      return;
    }

    const { data: reason } = await supabase.rpc("claim_agence_grant", { p_token: token });
    if (reason && reason !== "success") {
      return CLAIM_ERROR_MESSAGES[reason] ?? "Impossible de valider cette invitation.";
    }
  }

  return (
    <ConnexionForm
      title="Connexion agence"
      redirectPath="/agence/espace"
      afterSignIn={afterSignIn}
      blockedFooter={
        <Link
          href="/agence/espace"
          className="block text-center text-sm font-medium text-foreground underline underline-offset-4"
        >
          Continuer vers mon espace
        </Link>
      }
    />
  );
}
