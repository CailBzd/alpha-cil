---
objective: "Un propriétaire peut créer un compte soit directement (email + mot de passe), soit en réclamant l'accès via un lien d'invitation lié à une fiche logement ; un lien invalide, expiré ou déjà utilisé échoue proprement, et le propriétaire peut ensuite se connecter et accéder à son espace."
status: implemented
---

# Plan: Création de compte propriétaire (US-06)

## Overview

| Field      | Value                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| **Goal**   | Livrer US-06 du backlog MVP et poser les fondations `logements` nécessaires au reste du côté propriétaire |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md` — US-06, priorité 4 |

## Phases

| #   | Phase                                                | File                         |
| --- | ------------------------------------------------------ | ----------------------------- |
| 1   | Schéma logements & invitations                          | [`phase-1.md`](./phase-1.md) |
| 2   | Inscription propriétaire (directe et via invitation)    | [`phase-2.md`](./phase-2.md) |
| 3   | Connexion et espace propriétaire                        | [`phase-3.md`](./phase-3.md) |

## Decisions

| Decision                                                                                   | Why                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table `logements` minimale dès maintenant (id, adresse, `proprietaire_id` nullable), avant US-04/US-08 | C'est la seule façon de rendre réellement testable le parcours "inscription via invitation" ; `proprietaire_id` nullable modélise directement le cas de fiche orpheline en attente de réclamation, déjà identifié comme Open Question du PRD. |
| Validation et consommation du jeton d'invitation via des fonctions `SECURITY DEFINER` (`preview_logement_invitation`, `claim_logement_invitation`), jamais par une policy RLS directe sur `logement_invitations` | Une policy RLS auto-référentielle sur ce genre de table de jetons est fragile (INSTALL.md l'identifie explicitement comme un risque connu pour ce modèle d'accès par fiche) ; une fonction dédiée centralise la validation (expiration, usage unique) en un seul endroit vérifiable. |
| Aucune table de profil `proprietaires` séparée                                                | Contrairement à l'artisan (SIRET, corps de métier), rien ne distingue aujourd'hui un propriétaire au-delà de son compte `auth.users` ; en ajouter une maintenant serait une abstraction sans champ à y mettre. |
