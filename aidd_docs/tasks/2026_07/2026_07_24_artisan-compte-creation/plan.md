---
objective: "Un artisan peut créer un compte (email + SIRET + corps de métier), se connecter, et accéder à son espace ; un email déjà utilisé échoue proprement."
status: implemented
---

# Plan: Création de compte artisan (US-01)

## Overview

| Field      | Value                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| **Goal**   | Livrer US-01 du backlog MVP et scaffolder le monorepo nécessaire pour la première story    |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md` — US-01, priorité 1 |

## Phases

| #   | Phase                                    | File                         |
| --- | ----------------------------------------- | ---------------------------- |
| 1   | Scaffold monorepo & infra Supabase        | [`phase-1.md`](./phase-1.md) |
| 2   | Inscription artisan                       | [`phase-2.md`](./phase-2.md) |
| 3   | Connexion et espace artisan               | [`phase-3.md`](./phase-3.md) |

## Decisions

| Decision                                                                 | Why                                                                                                                                                       |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profil artisan en table relationnelle (`artisans`) liée à `auth.users`, pas en claims JWT custom | Les policies RLS des futures tables `intervention`/`logement` doivent joindre sur les attributs artisan (SIRET, métier) — un claim JWT ne se joint pas en SQL. |
| Email + mot de passe (pas de magic link) pour l'inscription artisan en V1  | L'artisan crée son compte en situation de chantier pour facturer immédiatement (parcours §5.1 du cahier des charges) ; un lien magique ajoute une latence incompatible avec cet usage terrain. |
