import { createServerSupabaseClient } from "@alpha-cil/db";
import { CHAUFFAGE_OPTIONS, VMC_OPTIONS } from "@/lib/equipements";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "../../../theme-toggle";
import { EquipementsForm } from "./EquipementsForm";
import { SignOutButton } from "./SignOutButton";

function chauffageLabel(value: string) {
  return CHAUFFAGE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function vmcLabel(value: string) {
  return VMC_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export default async function EspaceProprietairePage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Server Components can't write cookies. middleware.ts refreshes
        // the session and writes fresh cookies on every request, so a
        // write attempted here is safe to ignore.
      }
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/proprietaire/connexion");
  }

  const { data: logement } = await supabase
    .from("logements")
    .select("id, adresse, chauffage_type, vmc_type")
    .maybeSingle();

  const incomplet = logement ? !logement.chauffage_type || !logement.vmc_type : false;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="font-semibold tracking-tight text-foreground">Alpha CIL</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Mon logement</h1>
        {logement ? (
          <>
            <div className="space-y-1 text-sm">
              <p className="text-foreground">{logement.adresse}</p>
              <p className="text-muted-foreground">
                Chauffage :{" "}
                {logement.chauffage_type ? chauffageLabel(logement.chauffage_type) : "Non renseigné"}
              </p>
              <p className="text-muted-foreground">
                VMC : {logement.vmc_type ? vmcLabel(logement.vmc_type) : "Non renseigné"}
              </p>
            </div>
            {incomplet ? (
              <EquipementsForm
                logementId={logement.id}
                chauffageType={logement.chauffage_type}
                vmcType={logement.vmc_type}
              />
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun logement n&apos;est encore lié à votre compte.
          </p>
        )}
      </main>
    </div>
  );
}
