---
objective: "Un propriétaire voit la liste chronologique de toutes les interventions rattachées à son logement (artisan, date, type de travaux, statut RGE horodaté, mention décennale) ; sans intervention, il voit un état vide plutôt qu'une erreur."
status: pending
---

# Plan: Vue chronologique des interventions et attestations horodatées (US-09)

## Overview

| Field      | Value                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| **Goal**   | Livrer US-09 du backlog MVP : le propriétaire consulte l'historique de son logement          |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md` — US-09, priorité 8 |

## Phases

| #   | Phase                                                | File                         |
| --- | ------------------------------------------------------ | ----------------------------- |
| 1   | Schéma : accès propriétaire aux interventions           | [`phase-1.md`](./phase-1.md) |
| 2   | Vue historique dans l'espace propriétaire               | [`phase-2.md`](./phase-2.md) |

## Decisions

| Decision                                                                                   | Why                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Le SIRET de l'artisan est dénormalisé sur `interventions.artisan_siret` à la soumission (US-02/03 le récupère déjà pour la vérification RGE), plutôt que d'ouvrir une nouvelle policy de lecture sur `artisans` pour le propriétaire | Évite d'exposer toute la table `artisans` (dont son email de connexion) au propriétaire ; le SIRET est un identifiant professionnel public, adapté à cet affichage, et la donnée est déjà récupérée au même endroit du code. |
| Nouvelle policy `select` sur `interventions` pour le propriétaire, scoping via une sous-requête sur `logements.proprietaire_id` | Nécessaire : la seule policy `select` existante restreint aux artisans propriétaires de la ligne (`auth.uid() = artisan_id`), qui ne couvre jamais le propriétaire du logement. |
