---
objective: "Chaque intervention soumise porte un statut RGE vérifié et horodaté (sourcé depuis l'API ADEME à la date de l'intervention) et une attestation décennale associée avec la mention explicite de son caractère déclaratif."
status: implemented
---

# Plan: Vérification automatique RGE et décennale horodatée (US-03)

## Overview

| Field      | Value                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| **Goal**   | Livrer US-03 du backlog MVP : vérification RGE automatique + attestation décennale déclarative |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md` — US-03, priorité 5 |

## Phases

| #   | Phase                                                        | File                         |
| --- | --------------------------------------------------------------- | ----------------------------- |
| 1   | Schéma : attestation décennale & statut RGE                     | [`phase-1.md`](./phase-1.md) |
| 2   | Client ADEME et vérification à la soumission                    | [`phase-2.md`](./phase-2.md) |
| 3   | Profil artisan (décennale) et affichage du statut               | [`phase-3.md`](./phase-3.md) |

## Resources

| Source                                                                                          | Verified                                                                                                   |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines?qs=siret:<SIRET>` | Testé en direct : API publique, sans authentification, filtre par SIRET (`qs=siret:...`), retourne les qualifications RGE avec leurs dates de validité (`lien_date_debut`, `lien_date_fin`). 0 résultat pour un SIRET inconnu, réponse complète pour un SIRET réel testé. |

## Decisions

| Decision                                                                                   | Why                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client ADEME hébergé dans un nouveau package `packages/intervention`, jamais appelé directement depuis une Route Handler | INSTALL.md documente explicitement ce module comme le seul autorisé à parler aux APIs externes (ADEME) — respecter cette frontière évite qu'un futur module (US-04) ne duplique ou contourne cette logique. |
| Attestation décennale uploadée une seule fois sur le profil artisan (`artisans.attestation_decennale_path`), jamais ré-uploadée par intervention | Une police décennale couvre toutes les interventions d'un artisan, pas une par une ; la re-demander à chaque soumission ajouterait une friction que le PRD exclut explicitement ("sans changer ses habitudes de facturation"). |
| Vérification RGE au SIRET seul (une qualification active couvrant la date suffit), sans matcher le domaine au corps de métier de l'intervention | Le backlog ne demande qu'un statut vérifié/horodaté, pas un matching fin par domaine ; ajouter ce matching maintenant serait une complexité non demandée. |
| Un échec ou une indisponibilité de l'API ADEME ne bloque jamais la soumission d'une intervention ; le statut RGE est alors enregistré comme non vérifié | La dépendance externe ne doit pas devenir un point de défaillance unique du flux de soumission déjà validé (US-02) ; l'artisan reste libre de resoumettre plus tard sans perdre son intervention. |
