---
objective: "Un propriétaire voit clairement quels équipements de sa fiche sont renseignés et lesquels manquent, et peut compléter les manquants en une seule session ; une fiche déjà complète n'affiche aucune invite de complétion."
status: pending
---

# Plan: Découverte et complétion de la fiche pré-remplie (US-07)

## Overview

| Field      | Value                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| **Goal**   | Livrer US-07 du backlog MVP : le propriétaire complète les équipements manquants de sa fiche |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md` — US-07, priorité 7 |

## Phases

| #   | Phase                                                | File                         |
| --- | ------------------------------------------------------ | ----------------------------- |
| 1   | Schéma : équipements de la fiche logement               | [`phase-1.md`](./phase-1.md) |
| 2   | Affichage et complétion dans l'espace propriétaire      | [`phase-2.md`](./phase-2.md) |

## Decisions

| Decision                                                                                   | Why                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deux équipements seulement (chauffage, VMC) pour ce MVP, pas une liste exhaustive               | Le backlog ne nomme que ces deux exemples ("chauffage, VMC, etc.") ; modéliser une liste exhaustive maintenant serait une complexité non demandée. US-11 (rappels d'entretien) dira si d'autres équipements sont réellement nécessaires. |
| Mise à jour directe par le propriétaire via le client Supabase authentifié (RLS), sans Route Handler dédiée | La policy RLS `update` sur `logements` (scope au propriétaire) suffit à sécuriser l'opération ; ajouter un point d'API intermédiaire n'apporterait rien ici, contrairement aux uploads de fichiers des autres stories. |
