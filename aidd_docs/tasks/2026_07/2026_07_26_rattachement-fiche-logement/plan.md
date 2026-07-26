---
objective: "Une intervention vérifiée est toujours rattachée à une fiche logement (existante ou nouvellement créée à partir de l'adresse), jamais orpheline silencieusement ; le propriétaire est notifié par email ; une correspondance d'adresse ambiguë est signalée plutôt que rattachée par défaut."
status: pending
---

# Plan: Rattachement ou création automatique de la fiche logement (US-04)

## Overview

| Field      | Value                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| **Goal**   | Livrer US-04 du backlog MVP : chaque intervention artisan aboutit à une fiche logement, avec notification propriétaire |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md` — US-04, priorité 6 |

## Phases

| #   | Phase                                                          | File                         |
| --- | ------------------------------------------------------------------ | ----------------------------- |
| 1   | Schéma : adresse/email client, rattachement, fonction de matching | [`phase-1.md`](./phase-1.md) |
| 2   | Envoi d'email transactionnel (`packages/notifications`)           | [`phase-2.md`](./phase-2.md) |
| 3   | Câblage à la soumission d'intervention et affichage               | [`phase-3.md`](./phase-3.md) |

## Decisions

| Decision                                                                                   | Why                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Matching et création du logement via une fonction `SECURITY DEFINER` (`match_or_create_logement`), jamais par une policy RLS élargie | Un artisan doit pouvoir chercher/créer *n'importe quel* logement par adresse, alors que la policy `select` actuelle de `logements` restreint à `proprietaire_id = auth.uid()` — élargir cette policy exposerait tous les logements à tous les artisans ; la fonction centralise l'accès élevé en un seul point vérifiable, conformément au modèle documenté dans INSTALL.md. |
| Matching par égalité stricte d'adresse normalisée (espaces/casse), sans géocodage ni correspondance floue | Le backlog ne demande qu'une détection d'ambiguïté, pas un matching intelligent ; un vrai géocodage serait une complexité non demandée pour le MVP. |
| Une correspondance ambiguë (plusieurs logements matchent) laisse l'intervention avec `logement_id` null et `rattachement_ambigu = true`, jamais un rattachement par défaut | C'est explicitement le comportement demandé par le DoD ; aucun outil de résolution n'existe encore, donc le signal reste visible à l'artisan (sur son historique) en attendant une story dédiée. |
| Email transactionnel envoyé via SMTP configurable par variables d'environnement (`packages/notifications`), routé vers le testeur SMTP local de Supabase en développement | Aucun fournisseur n'est encore choisi ; SMTP est le plus petit dénominateur commun compatible avec n'importe quel fournisseur futur (SendGrid, Resend...) sans changer le code, et reste testable en local dès maintenant. |
| Email du client capturé à la soumission d'intervention, stocké sur `logements.contact_email` | Seul moyen de savoir qui notifier quand la fiche n'existe pas encore ou n'est pas réclamée ; correspond à l'Open Question du PRD sur les fiches orphelines. |
