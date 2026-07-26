---
objective: "Un propriétaire sans intervention artisan préalable crée sa fiche logement à partir d'une simple adresse ; le DPE est importé automatiquement quand l'API ADEME en connaît un pour cette adresse, et son absence n'empêche jamais la création."
status: pending
---

# Plan: Création manuelle d'une fiche logement à partir d'une adresse (US-08)

## Overview

| Field      | Value                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| **Goal**   | Livrer US-08 du backlog MVP : un propriétaire démarre son carnet sans artisan               |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md` — US-08, priorité 12 |

## Phases

| #   | Phase                                                        | File                         |
| --- | --------------------------------------------------------------- | ----------------------------- |
| 1   | Schéma : champs DPE et fonction de création/réclamation          | [`phase-1.md`](./phase-1.md) |
| 2   | Client DPE (`packages/logement`) et câblage                       | [`phase-2.md`](./phase-2.md) |
| 3   | Écran de création de fiche                                        | [`phase-3.md`](./phase-3.md) |

## Resources

| Source                                                                                          | Verified                                                                                                   |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines?q=<adresse>&size=1`           | Testé en direct : API publique, sans authentification, recherche plein texte par adresse (`q=`), retourne `etiquette_dpe` (classe énergie A-G) et `etiquette_ges` (classe GES A-G) par enregistrement. |

## Decisions

| Decision                                                                                   | Why                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nouveau module `packages/logement` pour le client DPE, distinct de `packages/intervention`      | INSTALL.md attribue déjà l'import DPE à `logement` ; la contradiction avec "seul intervention parle aux APIs externes" a été corrigée dans INSTALL.md (voir commit dédié) avant ce plan.        |
| Correspondance DPE par recherche plein texte sur l'adresse (premier résultat), sans géocodage exact | Le backlog ne demande qu'un import "si disponible", pas une correspondance garantie ; un vrai géocodage serait une complexité non demandée pour le MVP (même logique que la vérification RGE de US-03). |
| Recherche/création de logement via une nouvelle fonction `SECURITY DEFINER` (`create_logement_from_adresse`), pas une policy RLS élargie | Comme pour US-04, un propriétaire doit pouvoir vérifier si une fiche existe déjà pour son adresse (créée plus tôt par un artisan, non réclamée) sans qu'une policy RLS n'expose tous les logements à tous les propriétaires. |
| Une correspondance déjà réclamée par un autre propriétaire, ou ambiguë (plusieurs logements), bloque la création sans rien modifier | Même principe de prudence que US-04 : jamais de rattachement ou de prise de possession par défaut d'une fiche qui n'est pas clairement la sienne. |
| Un propriétaire ayant déjà une fiche ne peut pas en créer une seconde                            | Le MVP suppose un propriétaire pour un logement (le multi-biens est un non-goal explicite du PRD, prévu en V2) ; la Route Handler refuse l'action plutôt que de la permettre silencieusement. |
