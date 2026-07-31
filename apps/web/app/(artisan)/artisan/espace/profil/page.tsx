import { getServerSupabaseClient } from "@/lib/supabase-server";
import { DecennaleForm } from "./DecennaleForm";
import { SocieteForm } from "./SocieteForm";

export default async function ProfilArtisanPage() {
  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // The parent layout already guards this — reachable only if that
    // check is ever removed without this page being updated too.
    return null;
  }

  const { data: artisan } = await supabase
    .from("artisans")
    .select("siret, denomination, adresse, telephone, corps_metier, attestation_decennale_uploaded_at")
    .single();

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Mon profil</h1>
      <div className="space-y-6">
        <SocieteForm
          artisanId={user.id}
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
