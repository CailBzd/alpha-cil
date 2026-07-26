import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { ProprietaireInscriptionForm } from "./ProprietaireInscriptionForm";

export default async function ProprietaireInscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Server Components can't write cookies; this page is reachable
        // without a session, so there is nothing to refresh here.
      }
    },
  });

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
