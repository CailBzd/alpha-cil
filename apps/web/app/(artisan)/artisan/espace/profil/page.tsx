import { getServerSupabaseClient } from "@/lib/supabase-server";
import { headers } from "next/headers";
import { DecennaleForm } from "./DecennaleForm";
import { SocieteForm } from "./SocieteForm";

export default async function ProfilArtisanPage() {
  // Already validated once in middleware.ts and relayed via this header —
  // see the comment there. The parent layout guards the empty case; this is
  // reachable only if that check is ever removed without this page being
  // updated too.
  const userId = (await headers()).get("x-foya-user-id");
  if (!userId) {
    return null;
  }

  const supabase = await getServerSupabaseClient();

  const { data: artisan } = await supabase
    .from("artisans")
    .select("siret, denomination, adresse, telephone, corps_metier, attestation_decennale_uploaded_at")
    .single();

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Mon profil</h1>
      <div className="space-y-6">
        <SocieteForm
          artisanId={userId}
          siret={artisan?.siret ?? ""}
          denomination={artisan?.denomination ?? null}
          adresse={artisan?.adresse ?? null}
          telephone={artisan?.telephone ?? null}
          corpsMetier={artisan?.corps_metier ?? []}
        />
        <DecennaleForm uploadedAt={artisan?.attestation_decennale_uploaded_at ?? null} />
      </div>
    </>
  );
}
