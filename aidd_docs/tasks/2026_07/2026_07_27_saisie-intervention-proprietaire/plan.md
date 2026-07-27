---
objective: "Un propriétaire peut ajouter lui-même une intervention à sa fiche (type de travaux, date, montant, corps de métier, facture optionnelle), visible dans l'historique avec la mention qu'elle a été saisie par lui plutôt que par un artisan ; sans fiche logement, il est redirigé vers sa création avant de pouvoir saisir quoi que ce soit."
status: in-progress
---

# Plan: Saisie manuelle d'une intervention par le propriétaire (US-14)

## Overview

| Field      | Value                   |
| ---------- | ----------------------- |
| **Goal**   | Le propriétaire peut compléter son carnet sans dépendre d'un artisan qui utilise la plateforme. |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md`, US-14 |

## Phases

| #   | Phase                                          | File                         |
| --- | ----------------------------------------------- | ----------------------------- |
| 1   | Schéma : interventions ouvertes au propriétaire | [`phase-1.md`](./phase-1.md) |
| 2   | Route Handler de saisie propriétaire            | [`phase-2.md`](./phase-2.md) |
| 3   | Écran de saisie et affichage de l'origine       | [`phase-3.md`](./phase-3.md) |

## Decisions

| Decision                                                                 | Why                                                                                                          |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Pas de nouvelle colonne "origine" : `artisan_id is null` distingue déjà une saisie propriétaire d'une saisie artisan. | `artisan_id` est déjà `not null` uniquement pour le flux artisan ; le rendre nullable suffit à coder l'origine sans champ redondant. |
| La Route Handler retrouve elle-même le `logement_id` du propriétaire (`select` scopé par `auth.uid()`), jamais fourni par le client. | Empêche par construction qu'un propriétaire saisisse une intervention sur un logement qui n'est pas le sien ; même posture que les autres routes propriétaire de ce projet. |
| Accès direct à l'URL de saisie sans fiche logement redirige vers `/proprietaire/espace` (où le formulaire de création US-08 s'affiche), plutôt qu'un message d'erreur. | C'est exactement le scénario 2 de l'US : inviter à créer la fiche d'abord, jamais un échec silencieux. |
