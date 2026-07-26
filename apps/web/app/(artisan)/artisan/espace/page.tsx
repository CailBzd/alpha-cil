import { buttonVariants } from "@alpha-cil/ui";
import { createServerSupabaseClient } from "@alpha-cil/db";
import { CORPS_METIER_OPTIONS } from "@/lib/corps-metier";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "../../../theme-toggle";
import { SignOutButton } from "./SignOutButton";

const STATUT_LABELS: Record<string, string> = {
  en_attente_verification: "En attente de vérification",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });
const montantFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function corpsMetierLabel(value: string) {
  return CORPS_METIER_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export default async function EspaceArtisanPage() {
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
    redirect("/artisan/connexion");
  }

  const { data: interventions } = await supabase
    .from("interventions")
    .select(
      "id, type_travaux, date_intervention, montant_euros, corps_metier, statut, rge_verifie, rattachement_ambigu",
    )
    .order("date_intervention", { ascending: false });

  const { data: artisan } = await supabase
    .from("artisans")
    .select("attestation_decennale_uploaded_at")
    .eq("id", user.id)
    .single();

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
      <div className="mx-auto flex max-w-5xl gap-8 px-6 py-8">
        <nav className="w-48 shrink-0 space-y-1">
          <a
            href="/artisan/espace"
            className="block rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground"
          >
            Mes interventions
          </a>
          <a
            href="/artisan/espace/profil"
            className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
          >
            Mon profil
          </a>
        </nav>
        <main className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Mes interventions
            </h1>
            <Link href="/artisan/espace/interventions/nouvelle" className={buttonVariants()}>
              Soumettre une intervention
            </Link>
          </div>
          {interventions && interventions.length > 0 ? (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {interventions.map((intervention) => (
                <li
                  key={intervention.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
                >
                  <span className="text-muted-foreground">
                    {dateFormatter.format(new Date(intervention.date_intervention))}
                  </span>
                  <span className="flex-1 font-medium text-foreground">
                    {intervention.type_travaux}
                  </span>
                  <span className="text-muted-foreground">
                    {corpsMetierLabel(intervention.corps_metier)}
                  </span>
                  <span className="text-foreground">
                    {montantFormatter.format(Number(intervention.montant_euros))}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {STATUT_LABELS[intervention.statut] ?? intervention.statut}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      intervention.rge_verifie
                        ? "bg-secondary text-secondary-foreground"
                        : "border border-border text-muted-foreground"
                    }`}
                  >
                    {intervention.rge_verifie ? "RGE vérifié" : "RGE non vérifié"}
                  </span>
                  {intervention.rattachement_ambigu ? (
                    <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                      Rattachement à vérifier
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Vous n&apos;avez pas encore soumis d&apos;intervention. Utilisez le bouton ci-dessus
              pour ajouter la première.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Attestation décennale : déclarative, non vérifiée par une source tierce.{" "}
            {artisan?.attestation_decennale_uploaded_at ? (
              `Enregistrée le ${new Date(artisan.attestation_decennale_uploaded_at).toLocaleDateString("fr-FR")}.`
            ) : (
              <Link href="/artisan/espace/profil" className="underline underline-offset-4">
                Renseignez-la sur votre profil.
              </Link>
            )}
          </p>
        </main>
      </div>
    </div>
  );
}
