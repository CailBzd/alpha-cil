import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { AgenceInscriptionForm } from "./AgenceInscriptionForm";

export default async function AgenceInscriptionPage({
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
