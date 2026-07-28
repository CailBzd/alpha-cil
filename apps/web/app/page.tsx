import { buttonVariants } from "@alpha-cil/ui";
import {
  BadgeCheck,
  Bell,
  Download,
  FileText,
  House,
  KeyRound,
  Lock,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const PERSONAS = [
  {
    title: "Propriétaire",
    icon: House,
    accent: "primary",
    description:
      "Créez votre carnet en quelques clics à partir d'une simple adresse. DPE importé automatiquement, rappels avant chaque entretien, export PDF pour la revente.",
    cta: "Créer mon compte",
    href: "/proprietaire/inscription",
  },
  {
    title: "Artisan",
    icon: Wrench,
    accent: "accent",
    description:
      "Uploadez votre facture, renseignez le type de travaux : votre statut RGE est vérifié et horodaté automatiquement. Un book de références qui se construit tout seul.",
    cta: "Créer mon compte",
    href: "/artisan/inscription",
  },
  {
    title: "Agence immobilière",
    icon: KeyRound,
    accent: "primary",
    description:
      "Consultez le carnet d'un logement en lecture seule dès qu'un propriétaire vous y donne accès. De quoi répondre à un acquéreur sans le solliciter à chaque question.",
    cta: "Se connecter",
    href: "/proprietaire/connexion",
  },
] as const;

const FEATURES = [
  {
    icon: FileText,
    title: "DPE importé automatiquement",
    description:
      "La classe énergie et GES sont récupérées depuis les données ADEME dès que votre adresse en possède un.",
  },
  {
    icon: BadgeCheck,
    title: "RGE vérifié et horodaté",
    description:
      "Chaque intervention est croisée avec le registre officiel à sa date exacte — une preuve, pas une déclaration.",
  },
  {
    icon: Bell,
    title: "Rappels d'entretien",
    description: "Chaudière, ramonage, VMC : un email avant l'échéance, jamais après.",
  },
  {
    icon: Download,
    title: "Export maîtrisé",
    description:
      "PDF ou lien de consultation, avec exactement ce que vous choisissez d'inclure — jamais plus.",
  },
  {
    icon: Lock,
    title: "Accès sur invitation uniquement",
    description: "Rien n'est partagé par défaut. Vous accordez, vous révoquez, à tout moment.",
  },
  {
    icon: Zap,
    title: "Zéro ressaisie",
    description:
      "Une intervention artisan crée ou complète votre fiche automatiquement — vous n'avez rien à recopier.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              }}
            >
              <House className="size-4" strokeWidth={2} />
            </span>
            Alpha CIL
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/artisan/connexion"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              Espace artisan
            </Link>
            <Link
              href="/proprietaire/connexion"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              Espace propriétaire
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 py-20 sm:py-28">
          <div
            className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[36rem] w-[64rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, var(--color-primary), transparent), radial-gradient(closest-side at 70% 60%, var(--color-accent), transparent)",
            }}
          />
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Propriétaires · Artisans · Agences
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl">
              L&apos;historique complet de votre logement,{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                }}
              >
                prouvé et jamais perdu
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-muted-foreground sm:text-lg">
              Chaque intervention, chaque diagnostic, chaque attestation — au même endroit,
              vérifiés automatiquement, partagés uniquement quand vous le décidez.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/proprietaire/inscription" className={buttonVariants({ size: "lg" })}>
                Créer mon carnet propriétaire
              </Link>
              <Link
                href="/artisan/inscription"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Je suis artisan
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pour chaque acteur du logement
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {PERSONAS.map((persona) => (
              <div
                key={persona.title}
                className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{
                    background:
                      persona.accent === "primary"
                        ? "color-mix(in oklch, var(--color-primary) 15%, transparent)"
                        : "color-mix(in oklch, var(--color-accent) 15%, transparent)",
                    color:
                      persona.accent === "primary"
                        ? "var(--color-primary)"
                        : "var(--color-accent)",
                  }}
                >
                  <persona.icon className="size-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                  {persona.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{persona.description}</p>
                <Link
                  href={persona.href}
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-foreground underline underline-offset-4 group-hover:gap-2"
                >
                  {persona.cta} <span aria-hidden>→</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-border px-6 py-16">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            }}
          />
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Ce que le carnet fait pour vous
            </h2>
            <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-foreground shadow-sm">
                    <feature.icon className="size-4" strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div
            className="mx-auto max-w-3xl rounded-2xl px-8 py-12 text-center text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            }}
          >
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Prêt à démarrer votre carnet ?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-balance text-white/85">
              Gratuit à la création, prêt en moins de deux minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/proprietaire/inscription"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-white px-6 py-2.5 text-sm font-medium text-foreground shadow transition-colors hover:bg-white/90"
              >
                Créer mon carnet
              </Link>
              <Link
                href="/artisan/inscription"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/40 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Espace artisan
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span>Alpha CIL — Carnet de santé du logement</span>
          <div className="flex gap-6">
            <Link href="/artisan/connexion" className="hover:text-foreground">
              Espace artisan
            </Link>
            <Link href="/proprietaire/connexion" className="hover:text-foreground">
              Espace propriétaire
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
