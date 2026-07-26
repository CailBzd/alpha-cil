---
status: pending
---

# Instruction: Câblage à la soumission d'intervention et affichage

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
.
└── apps/
    └── web/
        └── app/
            ├── (artisan)/
            │   └── artisan/
            │       └── espace/
            │           ├── page.tsx                              ✏️ badge "rattachement à vérifier" si ambigu
            │           └── interventions/
            │               └── nouvelle/
            │                   └── InterventionForm.tsx           ✏️ champs adresse + email client
            └── api/
                └── artisan/
                    └── interventions/
                        └── route.ts                               ✏️ appelle match_or_create_logement, envoie l'email, enregistre le résultat
```

## User Journey

```mermaid
flowchart TD
  A[Artisan soumet une intervention] --> B[Ajoute desormais l'adresse du logement et l'email du client]
  B --> C[Validation existante (PDF, champs) inchangee]
  C --> D[Verification RGE inchangee]
  D --> E[match_or_create_logement appelee avec l'adresse et l'email]
  E -- ambigu --> F[Intervention inseree, logement_id null, rattachement_ambigu = true]
  E -- non ambigu --> G[Intervention inseree avec logement_id]
  G --> H{invitation_token present ?}
  H -- Oui --> I[Email avec lien de reclamation /proprietaire/inscription?token=...]
  H -- Non --> J[Email de notification simple vers le proprietaire deja rattache]
  F --> K[Redirection vers artisan/espace, badge ambigu visible]
  I --> K
  J --> K
```

## Wireframe

```txt
┌─────────────────────────────────────────────────┐
│ (1) Facture (PDF)                                │
│ (2) Type de travaux                              │
│ (3) Date de l'intervention                       │
│ (4) Montant (€)                                  │
│ (5) Corps de métier                              │
│ (6) Adresse du logement                          │
│ (7) Email du client                              │
│ (8) Photos avant/après (optionnel)                │
│ (9) Bouton "Soumettre l'intervention"             │
└─────────────────────────────────────────────────┘
```

1-5, 8-9. Champs déjà existants (US-02), inchangés.
6. Adresse du logement : texte libre, requise — sert au rattachement/à la création de la fiche.
7. Email du client : requis — seul moyen de notifier un propriétaire pas encore inscrit.

## Tasks to do

### `1)` Ajouter les champs adresse et email client au formulaire

> L'artisan renseigne, en plus des champs existants, où et pour qui il est intervenu.

1. Dans `apps/web/app/(artisan)/artisan/espace/interventions/nouvelle/InterventionForm.tsx`, ajouter `Input` pour `adresseLogement` (texte, requis) et `emailClient` (email, requis), avant le champ photos.

### `2)` Appeler le rattachement et envoyer la notification

> Toute intervention non ambiguë aboutit à un logement notifié ; une intervention ambiguë reste signalée.

1. Dans `apps/web/app/api/artisan/interventions/route.ts`, après la vérification RGE existante : appeler `supabase.rpc('match_or_create_logement', { p_adresse: adresseLogement, p_contact_email: emailClient })`.
2. Insérer l'intervention avec `adresse_logement`, `email_client`, `logement_id` (ou `null` si ambigu), `rattachement_ambigu`, en plus des champs déjà gérés par US-02/US-03.
3. Si `notify_email` est présent : envoyer un email via `sendMail` de `@alpha-cil/notifications` — avec un lien `/proprietaire/inscription?token=<invitation_token>` si un jeton est retourné, sinon un message de notification simple (nouvelle intervention ajoutée à son carnet).
4. Un échec d'envoi d'email n'annule jamais l'intervention déjà enregistrée (même logique de résilience que la vérification RGE).

### `3)` Signaler un rattachement ambigu à l'artisan

> L'artisan voit qu'une intervention n'a pas pu être rattachée automatiquement.

1. Dans `apps/web/app/(artisan)/artisan/espace/page.tsx`, ajouter un badge "Rattachement à vérifier" sur les lignes où `rattachement_ambigu = true`.

## Test acceptance criteria

| Task | Acceptance criteria                                                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Le formulaire de soumission affiche les champs adresse et email client, requis, en plus des champs existants.                                                |
| 2    | Une intervention pour une adresse inconnue crée un logement et une invitation, et un email de réclamation est envoyé (visible dans le testeur email local). Une intervention pour une adresse déjà réclamée envoie une notification simple, sans jeton. |
| 3    | Une intervention pour une adresse ambiguë (plusieurs logements correspondants) est enregistrée sans logement rattaché, et affiche le badge "Rattachement à vérifier" dans l'historique de l'artisan. |
