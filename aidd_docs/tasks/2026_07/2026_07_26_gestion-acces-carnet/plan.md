---
objective: "Un propriétaire accorde à un tiers nommé un accès total ou limité à des interventions précises de son logement, pour une durée définie ; ce tiers consulte en lecture seule via un lien à jeton ; une révocation coupe l'accès immédiatement, et aucun tiers ne consulte quoi que ce soit sans octroi explicite."
status: pending
---

# Plan: Gestion des accès au carnet — RGPD (US-10)

## Overview

| Field      | Value                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| **Goal**   | Livrer US-10 du backlog MVP : mécanisme central de contrôle d'accès au carnet, RGPD-sensible |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md` — US-10, priorité 9, impact **critic** |

## Phases

| #   | Phase                                                        | File                         |
| --- | ------------------------------------------------------------ | ----------------------------- |
| 1   | Schéma : octroi, portée par intervention, révocation          | [`phase-1.md`](./phase-1.md) |
| 2   | Gestion des accès côté propriétaire                            | [`phase-2.md`](./phase-2.md) |
| 3   | Consultation par le tiers via lien à jeton                     | [`phase-3.md`](./phase-3.md) |

## Decisions

| Decision                                                                                   | Why                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portée partielle au grain de l'intervention individuelle (table de jointure grant↔intervention), confirmé avec l'utilisateur | Le PRD listait cette granularité comme Open Question non tranchée ; l'utilisateur a choisi le grain le plus fin (par intervention) plutôt qu'un découpage grossier par section. |
| Consultation du tiers via un lien à jeton (`/consultation?token=`), sans compte à créer, confirmé avec l'utilisateur | Réutilise le pattern déjà validé de `logement_invitations`/`preview_logement_invitation` ; évite de construire un nouveau type de compte pour un tiers qui n'est peut-être jamais revenu sur la plateforme. |
| Portée "partielle" n'expose que les interventions explicitement sélectionnées, jamais l'adresse ni les équipements du logement | Le DoD dit "uniquement les informations sélectionnées" ; le propriétaire n'a rien sélectionné concernant l'adresse/les équipements dans ce cas, donc rien de tout ça n'est montré. La portée "totale" reste la seule à tout exposer. |
| Validation et lecture pour le tiers via des fonctions `SECURITY DEFINER` (`validate_access_grant`, `list_granted_interventions`), jamais par une policy RLS ouverte à `anon` | Le tiers n'est pas authentifié : aucune policy RLS ne peut le distinguer sans jeton. Centraliser la validation (expiration, révocation) dans des fonctions dédiées, réutilisant le modèle déjà éprouvé sur `logement_invitations`, garantit qu'une révocation ou une expiration est vérifiée à chaque appel — jamais mise en cache côté client. |
| L'octroi et la révocation eux-mêmes passent par des policies RLS directes (pas de fonction `SECURITY DEFINER`) | Contrairement à l'artisan qui agit sur des logements qu'il ne possède pas (US-04), le propriétaire agit ici sur ses propres ressources ; une policy RLS scoping sur `proprietaire_id` suffit, sans élévation de privilège nécessaire. |
| Le lien de consultation est affiché au propriétaire pour qu'il le partage lui-même ; aucun email n'est envoyé automatiquement pour cette story | Le DoD ne demande pas de notification par email ici (contrairement à US-04) ; envoyer un email au tiers ajouterait un chemin non demandé et un risque RGPD (envoyer les coordonnées d'un tiers non encore consentant à un mailing automatisé). |
