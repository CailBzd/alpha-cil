# Alpha CIL

Carnet d'Information du Logement (CIL) numérique — un carnet de santé de la
maison, alimenté par les artisans, pour la tranquillité du propriétaire et la
valorisation du bien à la revente. Le CIL est obligatoire en France depuis
2023 (loi Climat et Résilience) mais aucune plateforme n'est imposée ; ce
projet vise à en devenir la référence de facto.

Contexte produit complet : [`docs/cahier-des-charges-cil.md`](docs/cahier-des-charges-cil.md).
Décisions techniques et justification du stack : [`aidd_docs/INSTALL.md`](aidd_docs/INSTALL.md).

## Stack

- **Front + back** : Next.js 15 (App Router), TypeScript — Route Handlers en guise d'API.
- **Base de données** : Supabase Postgres, Row-Level Security via des fonctions `SECURITY DEFINER` pour tout modèle d'accès qui traverse plusieurs tables (évite la récursion RLS — voir l'avertissement plus bas).
- **Auth** : Supabase Auth (email/mot de passe). Trois personas distinctes, chacune sans colonne `role` : l'appartenance se déduit de la présence d'une ligne dans `artisans`, `agences`, ou d'un `logements.proprietaire_id`.
- **Monorepo** : pnpm workspaces + Turborepo (`apps/*`, `packages/*`).

## Structure

```
apps/web/                 Next.js 15 App Router
  app/(public)/           pages publiques : inscriptions, connexions, consultation
  app/(owner)/             espace propriétaire (authentifié)
  app/(artisan)/           espace artisan (authentifié)
  app/(agence)/            espace agence (authentifié, accès en lecture seule sur invitation)
  app/api/                 Route Handlers
  middleware.ts            rafraîchit la session uniquement — jamais d'ACL ici
packages/
  db/                      client Supabase (browser/server/service-role)
  intervention/            vérif RGE + vérif SIRET (ademe.ts, sirene.ts)
  logement/                import DPE (ADEME)
  notifications/           envoi d'email transactionnel (Resend)
  ui/                      composants partagés (Input, PasswordInput, Button, AuthCard...)
supabase/migrations/       migrations SQL numérotées, source de vérité du schéma
```

## Démarrer en local

Prérequis : Node.js, pnpm, Docker Desktop (pour Supabase local), Supabase CLI (`npx supabase`).

```bash
pnpm install
npx supabase start        # lance Postgres/Auth/Storage local dans Docker
cp .env.example apps/web/.env   # remplir avec les clés affichées par `supabase start`
pnpm dev                  # démarre apps/web sur http://localhost:3000
```

`npx supabase status` réaffiche les URLs et clés à tout moment. `npx supabase db reset` réapplique toutes les migrations sur une base vierge — à utiliser après avoir ajouté une migration.

## Les trois personas

| Persona | Inscription | Portée d'accès |
|---|---|---|
| **Propriétaire** | libre, ou via invitation d'un contact | plein accès à son propre logement |
| **Artisan** | libre, SIRET vérifié en direct (bloquant) via `recherche-entreprises.api.gouv.fr` | ses propres interventions |
| **Agence** | uniquement sur invitation du propriétaire, SIRET vérifié en direct (bloquant) | lecture seule sur le(s) logement(s) partagé(s), tant que l'accès n'est pas expiré/révoqué |

Aucune des trois inscriptions ne demande de confirmation d'email en local
(`enable_confirmations = false` dans `supabase/config.toml`) — à activer avant
tout déploiement en production.

## Point d'attention RLS

Une policy RLS qui référence une autre table dont les propres policies
référencent la table de départ provoque une récursion infinie côté Postgres
(déjà rencontré sur `logements` ↔ `logement_access_grants`). La solution
du projet : faire passer ce genre de vérification croisée par une fonction
`SECURITY DEFINER` (qui contourne RLS pour ses propres requêtes internes)
plutôt qu'une sous-requête brute dans la policy — voir
`supabase/migrations/0028_logements_interventions_select_agence.sql` pour un
exemple concret.

## Conventions

Voir [`CONTRIBUTING.md`](CONTRIBUTING.md).
