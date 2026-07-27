---
objective: "Un propriétaire qui a déclaré une date de dernier entretien pour un équipement qui en nécessite un (chaudière gaz, chauffage bois/ramonage, VMC) reçoit un email de rappel avant l'échéance annuelle ; une fiche sans équipement concerné, ou sans date déclarée, ne génère jamais de rappel."
status: in-progress
---

# Plan: Rappels d'entretien automatiques (US-11)

## Overview

| Field      | Value                   |
| ---------- | ----------------------- |
| **Goal**   | Le propriétaire n'oublie pas un entretien obligatoire ou recommandé sur son logement. |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md`, US-11 |

## Phases

| #   | Phase                                              | File                         |
| --- | ---------------------------------------------------- | ----------------------------- |
| 1   | Schéma : dates d'entretien + accès système restreint | [`phase-1.md`](./phase-1.md) |
| 2   | Saisie de la date de dernier entretien               | [`phase-2.md`](./phase-2.md) |
| 3   | Calcul et envoi des rappels                          | [`phase-3.md`](./phase-3.md) |

## Decisions

| Decision                                                                 | Why                                                                                                          |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Date de référence = champ explicite "dernier entretien" saisi par le propriétaire, jamais déduite de l'historique des interventions. | Choix utilisateur explicite : aucun corps de métier ne distingue un entretien programmé d'une simple réparation, une déduction serait fragile. |
| Équipements concernés, strictement ceux nommés par l'US : chauffage gaz (chaudière) et bois (ramonage), VMC simple/double flux. Chauffage électrique/pompe à chaleur/autre et VMC absente : aucun rappel. | Rester au périmètre exact de l'US plutôt que d'inventer des obligations légales (ex. périodicité PAC) non demandées. |
| Échéance = dernier entretien + 1 an (l'exemple donné par l'US), rappel envoyé dès que l'échéance tombe dans les 30 jours à venir. | 1 an est l'exemple explicite de l'AC ; 30 jours reprend la fenêtre déjà utilisée ailleurs dans le projet pour les invitations, par cohérence. |
| Déclenchement : Route Handler `POST /api/cron/rappels-entretien`, protégée par un secret (`CRON_SECRET`) comparé à l'en-tête `Authorization`, destinée à un scheduler externe (Vercel Cron en production) — jamais appelée sur une action utilisateur. | Choix utilisateur explicite. En local, elle se déclenche manuellement pour la vérification. |
| Lecture des candidats au rappel via une fonction `SECURITY DEFINER` (jointure `auth.users` pour l'email), dont l'exécution est retirée de `PUBLIC`/`authenticated` et accordée au seul rôle `service_role`. | `auth.users` n'est pas exposée via l'API REST (seul `public` l'est, cf. `supabase/config.toml`) ; sans ce retrait de droit, la fonction serait appelable par n'importe quel utilisateur connecté et exposerait les emails de tous les propriétaires. |
