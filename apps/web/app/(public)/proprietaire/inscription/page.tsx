import { getServerSupabaseClient } from "@/lib/supabase-server";
import { ProprietaireInscriptionForm } from "./ProprietaireInscriptionForm";

export default async function ProprietaireInscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const supabase = await getServerSupabaseClient();

  let invitation: { adresse: string; valid: boolean } | null = null;
  if (token) {
    const { data } = await supabase.rpc("preview_logement_invitation", {
      invitation_token: token,
    });
    invitation = data?.[0] ?? null;
  }

  const invitationInvalid = Boolean(token) && (!invitation || !invitation.valid);

  return (
    <ProprietaireInscriptionForm
      token={token ?? null}
      invitationAdresse={invitation?.valid ? invitation.adresse : null}
      invitationInvalid={invitationInvalid}
    />
  );
}
