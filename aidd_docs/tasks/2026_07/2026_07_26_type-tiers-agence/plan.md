---
objective: "Le propriétaire distingue, à la création d'un accès, si le tiers est une agence immobilière ou un autre type de tiers ; cette distinction est visible dans la liste des accès actifs et adapte la présentation de la page de consultation, sans changer le mécanisme d'accès (portée, expiration, révocation) déjà livré par US-10."
status: implemented
---

# Plan: Distinction du type de tiers — agence immobilière (US-13)

## Overview

| Field      | Value                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| **Goal**   | US-13 confirmée déjà couverte fonctionnellement par le mécanisme d'accès de US-10 ; ce plan ajoute uniquement la distinction "type de tiers" demandée en plus du DoD strict |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md` — US-13, priorité 10 ; confirmé avec l'utilisateur que le DoD lui-même est déjà satisfait par `/consultation` (US-10) |

## Phases

| #   | Phase                                                | File                         |
| --- | ------------------------------------------------------ | ----------------------------- |
| 1   | Type de tiers sur l'octroi, la liste, et la consultation | [`phase-1.md`](./phase-1.md) |

## Decisions

| Decision                                                                                   | Why                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Une seule phase                                                                                | Ajout mécanique d'un champ traversant des composants déjà livrés (formulaire d'octroi, liste des accès, page de consultation) ; aucune nouvelle logique d'accès, de portée, ou de révocation. |
| `tiers_type` stocké sur `logement_access_grants` avec une valeur par défaut `'autre'`          | Les octrois déjà créés par US-10 restent valides sans migration de données ; le type reste une information d'affichage, jamais un critère de sécurité ou de portée. |
