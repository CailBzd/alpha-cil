---
objective: "Un artisan connecté peut soumettre une intervention (facture PDF + type de travaux, date, montant, corps de métier) enregistrée en attente de vérification ; un fichier non-PDF échoue proprement sans créer d'intervention partielle."
status: pending
---

# Plan: Soumission de facture et saisie assistée d'intervention (US-02)

## Overview

| Field      | Value                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| **Goal**   | Livrer US-02 du backlog MVP : un artisan peut déclarer une intervention avec sa facture    |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md` — US-02, priorité 2 |

## Phases

| #   | Phase                                     | File                         |
| --- | ------------------------------------------ | ---------------------------- |
| 1   | Schéma interventions & stockage factures   | [`phase-1.md`](./phase-1.md) |
| 2   | Formulaire de soumission d'intervention    | [`phase-2.md`](./phase-2.md) |

## Decisions

| Decision                                                                                      | Why                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table `interventions` relationnelle liée à `artisans`, pas de blob JSON                          | US-03 (vérif RGE/décennale), US-04 (rattachement fiche logement) et US-05 (historique) ont toutes besoin de filtrer/joindre sur des colonnes typées (statut, date, artisan) — un blob JSON empêcherait ces requêtes. |
| Facture et photos dans un bucket Supabase Storage privé, jamais public                          | La facture porte des données personnelles et financières du client de l'artisan ; seul l'artisan propriétaire de l'intervention doit pouvoir la récupérer, via policy RLS sur `storage.objects`. |
| Statut initial `en_attente_verification` figé à la création, jamais modifiable par l'artisan lui-même | US-03 est seule responsable de faire progresser ce statut (vérification RGE/décennale) ; laisser l'artisan le changer viderait la vérification de son sens.                                  |
