import { getServerSupabaseClient } from "@/lib/supabase-server";
import { AgenceInscriptionForm } from "./AgenceInscriptionForm";

export default async function AgenceInscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const supabase = await getServerSupabaseClient();

  let invitation: { tiers_email: string; adresse: string; valid: boolean } | null = null;
  if (token) {
    const { data } = await supabase.rpc("preview_agence_grant", { p_token: token });
    invitation = data?.[0] ?? null;
  }

  const invitationValid = Boolean(token) && Boolean(invitation?.valid);

  return (
    <AgenceInscriptionForm
      token={token ?? null}
      invitationValid={invitationValid}
      tiersEmail={invitationValid ? invitation!.tiers_email : null}
      adresse={invitationValid ? invitation!.adresse : null}
    />
  );
}
