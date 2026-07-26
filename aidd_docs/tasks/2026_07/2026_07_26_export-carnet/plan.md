---
objective: "Un propriétaire choisit précisément quelles interventions de son carnet inclure, puis obtient soit un PDF téléchargeable, soit un lien de consultation, ne contenant jamais rien de plus que sa sélection ; une tentative d'export sans rien sélectionner est signalée avant confirmation, jamais acceptée silencieusement."
status: pending
---

# Plan: Export PDF/lien contrôlé pour un tiers (US-12)

## Overview

| Field      | Value                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| **Goal**   | Livrer US-12 du backlog MVP : export PDF ou lien de synthèse, sélection précise, jamais vide sans confirmation |
| **Source** | `aidd_docs/tasks/2026_07/2026_07_24-carnet-sante-logement-backlog.md` — US-12, priorité 11, impact major |

## Phases

| #   | Phase                                                | File                         |
| --- | ------------------------------------------------------ | ----------------------------- |
| 1   | Génération du PDF                                       | [`phase-1.md`](./phase-1.md) |
| 2   | Écran d'export : sélection, lien, PDF, confirmation à vide | [`phase-2.md`](./phase-2.md) |

## Decisions

| Decision                                                                                   | Why                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Le mode "lien" réutilise intégralement le mécanisme d'octroi de US-10 (portée partielle, sélection par intervention), sans nouvelle table | Un lien de synthèse contrôlé est exactement un octroi `partiel` : même garantie qu'il ne contient jamais que la sélection, même révocabilité, même page `/consultation`. Dupliquer ce mécanisme serait une régression. |
| Le mode "PDF" est un flux à la demande, sans persistance ni jeton                              | Contrairement à un lien, un PDF téléchargé ne peut techniquement pas être révoqué une fois entre les mains du tiers ; il n'y a donc rien à stocker, juste une génération à la volée depuis la sélection courante. |
| Génération du PDF via `@react-pdf/renderer`, confirmé avec l'utilisateur                        | Composants JSX cohérents avec la stack Next.js/React déjà en place, pas de navigateur headless à gérer côté serveur. |
| Écran dédié "Exporter" (`/proprietaire/espace/export`), distinct de "Gérer les accès", confirmé avec l'utilisateur | Un export "revente/notaire" est un geste ponctuel et différent, dans l'intention de l'utilisateur, d'un octroi d'accès continu ; un écran dédié reste plus clair même si le mode "lien" réutilise le même mécanisme en coulisses. |
