# Carnet de Santé du Logement — MVP Backlog

## US-01: "Création de compte artisan"

**As a** artisan du bâtiment
**I want** créer un compte sur la plateforme
**So that** je peux commencer à déclarer mes interventions et construire mon historique professionnel

### Acceptance criteria

```gherkin
Scenario: Inscription réussie
  Given je suis un artisan sans compte
  When je m'inscris avec mon email, mon SIRET et mon corps de métier
  Then mon compte est créé et je peux accéder à mon espace artisan

Scenario: Email déjà utilisé
  Given un compte existe déjà avec mon email
  When je tente de m'inscrire avec ce même email
  Then je reçois un message clair m'invitant à me connecter ou à réinitialiser mon mot de passe
```

### Definition of Done (functional)

- Un artisan peut créer un compte avec email + SIRET + corps de métier.
- Un artisan peut se connecter à son espace après inscription.
- Une tentative d'inscription avec un email déjà utilisé échoue avec un message explicite.

### Estimation

- **Story points**: 3
- **Impact**: minor — fonctionnalité additive, aucun comportement existant modifié.
- **Dependencies**: aucune
- **Priority**: 1

---

## US-02: "Soumission de facture et saisie assistée d'intervention"

**As a** artisan
**I want** uploader une facture PDF et saisir le type de travaux, la date, le montant et le corps de métier
**So that** je documente mon intervention sans changer mes habitudes de facturation

### Acceptance criteria

```gherkin
Scenario: Soumission complète
  Given je suis connecté à mon espace artisan
  When j'uploade une facture PDF et renseigne type de travaux, date, montant, corps de métier
  Then l'intervention est enregistrée en statut "en attente de vérification"

Scenario: Fichier non supporté
  Given je suis connecté à mon espace artisan
  When j'uploade un fichier qui n'est pas un PDF
  Then je reçois un message m'indiquant le format attendu et l'intervention n'est pas créée
```

### Definition of Done (functional)

- Un artisan peut uploader une facture PDF et saisir les champs requis en une seule soumission.
- Les photos avant/après peuvent être ajoutées mais ne sont jamais bloquantes.
- Un fichier non-PDF est rejeté avec un message clair, sans créer d'intervention partielle.

### Estimation

- **Story points**: 5
- **Impact**: minor — nouvelle fonctionnalité isolée, ne touche aucun flux existant.
- **Dependencies**: US-01 (compte artisan)
- **Priority**: 2

---

## US-03: "Vérification automatique RGE et décennale horodatée"

**As a** artisan
**I want** que mon statut RGE et mon assurance décennale soient vérifiés et horodatés automatiquement à la date de l'intervention
**So that** j'ai une preuve factuelle et opposable de mes garanties en cas de litige

### Acceptance criteria

```gherkin
Scenario: Artisan RGE actif à la date de l'intervention
  Given une intervention soumise avec une date et un artisan identifié
  When le système interroge l'API ADEME/France Rénov pour le statut RGE à cette date
  Then le statut RGE est enregistré et horodaté sur l'intervention

Scenario: Vérification décennale non automatisable
  Given une intervention soumise
  When aucune API publique ne permet de vérifier l'assurance décennale
  Then l'attestation décennale uploadée par l'artisan est associée à l'intervention avec une mention explicite "déclaratif, non vérifié par une source tierce"
```

### Definition of Done (functional)

- Chaque intervention affiche un statut RGE vérifié et horodaté à sa date, sourcé depuis l'API ADEME.
- Chaque intervention affiche l'attestation décennale associée, avec une mention claire de son caractère déclaratif tant qu'aucune source de vérification tierce n'existe.
- Le propriétaire et l'artisan voient la même information de vérification, sans contradiction.

### Estimation

- **Story points**: 8
- **Impact**: major — établit la véracité de la promesse centrale du produit (preuve fiable) ; une erreur ici fausse la confiance de tout le système, sans toutefois modifier un composant partagé existant.
- **Dependencies**: US-02 (intervention soumise)
- **Priority**: 5

---

## US-04: "Rattachement ou création automatique de la fiche logement"

**As a** artisan
**I want** que mon intervention soit automatiquement rattachée à la fiche logement de mon client, ou qu'une fiche soit créée si aucune n'existe
**So that** je n'ai pas à gérer moi-même la mise en relation avec la fiche du bien

### Acceptance criteria

```gherkin
Scenario: Fiche logement existante
  Given une intervention vérifiée pour une adresse déjà associée à une fiche logement
  When le système traite l'intervention
  Then l'intervention est ajoutée à la fiche existante et le propriétaire est notifié

Scenario: Aucune fiche logement existante
  Given une intervention vérifiée pour une adresse sans fiche logement associée
  When le système traite l'intervention
  Then une nouvelle fiche logement est créée à partir de l'adresse et le propriétaire est notifié par email
```

### Definition of Done (functional)

- Une intervention vérifiée aboutit toujours à une fiche logement (existante ou nouvellement créée), jamais orpheline silencieusement.
- Le propriétaire reçoit une notification à chaque rattachement ou création.
- Le rattachement erroné à la mauvaise fiche (mauvais destinataire) ne se produit pas pour une correspondance ambiguë : le cas ambigu est signalé pour résolution plutôt que rattaché par défaut.

### Estimation

- **Story points**: 8
- **Impact**: critic — une erreur de rattachement expose la fiche (données personnelles et financières) d'un propriétaire à un tiers non concerné ; risque RGPD direct nécessitant une revue explicite avant construction.
- **Dependencies**: US-03 (intervention vérifiée)
- **Priority**: 6

---

## US-05: "Consultation de l'historique d'interventions par l'artisan"

**As a** artisan
**I want** consulter mon propre historique d'interventions
**So that** je peux m'en servir comme book de références professionnel

### Acceptance criteria

```gherkin
Scenario: Historique non vide
  Given j'ai soumis plusieurs interventions vérifiées
  When j'ouvre mon espace artisan
  Then je vois la liste chronologique de mes interventions avec leur statut de vérification

Scenario: Aucune intervention encore soumise
  Given je viens de créer mon compte
  When j'ouvre mon espace artisan
  Then je vois un état vide m'invitant à soumettre ma première intervention
```

### Definition of Done (functional)

- Un artisan voit la liste chronologique de toutes ses interventions passées avec leur statut de vérification.
- Un artisan sans intervention voit un état vide explicite, pas une erreur.

### Estimation

- **Story points**: 2
- **Impact**: minor — vue de lecture isolée, aucun effet de bord sur les données.
- **Dependencies**: US-02 (interventions soumises)
- **Priority**: 3

---

## US-06: "Création de compte propriétaire"

**As a** propriétaire
**I want** créer un compte, soit en m'inscrivant directement, soit en réclamant l'accès suite à une notification artisan
**So that** je peux consulter et gérer le carnet de mon logement

### Acceptance criteria

```gherkin
Scenario: Inscription via notification artisan
  Given j'ai reçu un email m'informant qu'une intervention a été ajoutée à mon logement
  When je clique sur le lien et complète la création de mon compte
  Then j'accède à ma fiche logement déjà partiellement remplie

Scenario: Inscription directe sans notification préalable
  Given je n'ai reçu aucune notification
  When je m'inscris directement sur la plateforme
  Then mon compte est créé et je peux créer ou rechercher ma fiche logement
```

### Definition of Done (functional)

- Un propriétaire peut créer un compte à partir d'un lien de notification ou en s'inscrivant directement.
- Un compte créé via notification est automatiquement relié à la fiche logement concernée.
- Un lien de notification expiré ou déjà utilisé affiche un message clair plutôt qu'une erreur technique.

### Estimation

- **Story points**: 5
- **Impact**: minor — parcours d'inscription additif, la sécurité du lien d'invitation est un point d'attention mais ne modifie aucun comportement existant.
- **Dependencies**: aucune
- **Priority**: 4

---

## US-07: "Découverte et complétion de la fiche pré-remplie"

**As a** propriétaire
**I want** découvrir ma fiche logement déjà partiellement remplie par une intervention artisan et compléter les informations manquantes
**So that** je m'engage avec le carnet sans effort initial de saisie

### Acceptance criteria

```gherkin
Scenario: Complétion des champs manquants
  Given ma fiche logement contient déjà une intervention mais pas mes équipements
  When j'ouvre ma fiche et renseigne mes équipements (chauffage, VMC, etc.)
  Then ma fiche logement est mise à jour et prête pour générer des rappels d'entretien

Scenario: Fiche déjà complète
  Given ma fiche logement est déjà entièrement renseignée
  When j'ouvre ma fiche
  Then je vois toutes les informations sans invite de complétion superflue
```

### Definition of Done (functional)

- Un propriétaire voit clairement quelles informations de sa fiche sont déjà remplies et lesquelles manquent.
- Un propriétaire peut compléter les champs manquants en une seule session.
- Une fiche déjà complète n'affiche pas d'invite de complétion inutile.

### Estimation

- **Story points**: 3
- **Impact**: minor — édition de données propres à l'utilisateur, sans effet sur d'autres comptes.
- **Dependencies**: US-04 (fiche existante), US-06 (compte propriétaire)
- **Priority**: 7

---

## US-08: "Création manuelle d'une fiche logement à partir d'une adresse"

**As a** propriétaire
**I want** créer moi-même une fiche logement à partir de mon adresse, avec import automatique du DPE si disponible
**So that** je peux démarrer mon carnet même sans intervention artisan préalable

### Acceptance criteria

```gherkin
Scenario: DPE disponible pour l'adresse
  Given je saisis l'adresse de mon logement
  When un DPE existe dans les données ADEME pour cette adresse
  Then ma fiche est créée avec le DPE importé automatiquement

Scenario: Aucun DPE disponible
  Given je saisis l'adresse de mon logement
  When aucun DPE n'existe dans les données ADEME pour cette adresse
  Then ma fiche est créée vide sur ce champ, sans bloquer la création
```

### Definition of Done (functional)

- Un propriétaire peut créer une fiche logement à partir d'une simple adresse.
- Le DPE est importé automatiquement quand il est disponible, sans ressaisie.
- L'absence de DPE n'empêche jamais la création de la fiche.

### Estimation

- **Story points**: 5
- **Impact**: minor — chemin de création alternatif et additif, n'altère pas le chemin de création piloté par l'artisan (US-04).
- **Dependencies**: aucune
- **Priority**: 11

---

## US-09: "Vue chronologique des interventions et attestations horodatées"

**As a** propriétaire
**I want** consulter la liste chronologique de toutes les interventions sur mon logement avec leurs attestations horodatées
**So that** j'ai une preuve fiable et consultable de l'entretien de mon bien

### Acceptance criteria

```gherkin
Scenario: Historique avec plusieurs interventions
  Given ma fiche logement a reçu plusieurs interventions
  When j'ouvre la vue historique
  Then je vois chaque intervention avec artisan, date, type de travaux et attestations horodatées

Scenario: Aucune intervention encore enregistrée
  Given ma fiche logement vient d'être créée
  When j'ouvre la vue historique
  Then je vois un état vide plutôt qu'une erreur
```

### Definition of Done (functional)

- Un propriétaire voit chaque intervention de sa fiche avec l'artisan, la date, le type de travaux et les attestations horodatées associées.
- Une fiche sans intervention affiche un état vide explicite.

### Estimation

- **Story points**: 3
- **Impact**: minor — vue de lecture sur des données déjà existantes, aucune mutation.
- **Dependencies**: US-04 (interventions rattachées), US-06 (compte propriétaire)
- **Priority**: 8

---

## US-10: "Gestion des accès au carnet (RGPD)"

**As a** propriétaire
**I want** choisir précisément qui peut consulter tout ou partie de mon carnet, et révoquer cet accès à tout moment
**So that** je garde le contrôle total de mes données personnelles, sans partage par défaut

### Acceptance criteria

```gherkin
Scenario: Octroi d'un accès partiel
  Given je consulte les paramètres d'accès de ma fiche
  When j'accorde un accès limité à un tiers nommé pour une durée définie
  Then ce tiers peut consulter uniquement les informations que j'ai sélectionnées, jusqu'à révocation ou expiration

Scenario: Révocation d'un accès
  Given un tiers dispose d'un accès actif à ma fiche
  When je révoque cet accès
  Then ce tiers ne peut plus consulter aucune information de ma fiche immédiatement
```

### Definition of Done (functional)

- Un propriétaire peut accorder un accès total ou partiel à un tiers nommé, avec une portée et une durée qu'il choisit.
- Un propriétaire peut révoquer un accès à tout moment, avec effet immédiat.
- Aucun tiers ne peut consulter la fiche sans un octroi explicite du propriétaire.

### Estimation

- **Story points**: 8
- **Impact**: critic — mécanisme de contrôle d'accès central : une faille ici expose directement des données personnelles et financières à des tiers non autorisés, nécessite une revue explicite avant construction.
- **Dependencies**: US-06 (compte propriétaire)
- **Priority**: 9

---

## US-11: "Rappels d'entretien automatiques"

**As a** propriétaire
**I want** recevoir des rappels d'entretien basés sur les équipements déclarés sur ma fiche
**So that** je n'oublie pas un entretien obligatoire ou recommandé (chaudière, ramonage, VMC)

### Acceptance criteria

```gherkin
Scenario: Équipement avec échéance d'entretien
  Given ma fiche déclare une chaudière avec une échéance d'entretien annuelle
  When l'échéance approche
  Then je reçois une notification email/app avant la date d'échéance

Scenario: Aucun équipement déclaré
  Given ma fiche ne déclare aucun équipement nécessitant un entretien programmé
  When le système génère les rappels
  Then aucun rappel n'est envoyé pour cette fiche
```

### Definition of Done (functional)

- Un propriétaire reçoit un rappel avant l'échéance d'entretien de chaque équipement déclaré qui en nécessite un.
- Une fiche sans équipement concerné ne génère aucun rappel superflu.

### Estimation

- **Story points**: 5
- **Impact**: minor — fonctionnalité de notification additive, ne modifie aucune donnée existante.
- **Dependencies**: US-04 ou US-08 (fiche avec équipements déclarés)
- **Priority**: 12

---

## US-12: "Export PDF/lien contrôlé pour un tiers"

**As a** propriétaire
**I want** générer un export PDF ou un lien de synthèse de mon carnet, en choisissant précisément les informations incluses
**So that** je peux le présenter à un notaire, un acheteur ou un assureur au moment de la revente

### Acceptance criteria

```gherkin
Scenario: Export avec sélection d'informations
  Given je consulte mon carnet complet
  When je sélectionne les interventions et attestations à inclure et génère l'export
  Then je reçois un PDF ou un lien ne contenant que les informations sélectionnées

Scenario: Export sans aucune information sélectionnée
  Given je lance la génération d'export sans rien sélectionner
  When je confirme
  Then le système m'avertit qu'aucune information ne sera incluse et me demande de confirmer ou de sélectionner du contenu
```

### Definition of Done (functional)

- Un propriétaire peut choisir précisément quelles interventions et attestations figurent dans son export.
- Le PDF ou lien généré ne contient jamais d'information non sélectionnée par le propriétaire.
- Une tentative d'export vide est signalée avant confirmation, pas silencieusement acceptée.

### Estimation

- **Story points**: 5
- **Impact**: major — moment clé du parcours (revente), une erreur de scope d'export pourrait sur-partager des informations non voulues par le propriétaire.
- **Dependencies**: US-09 (historique des interventions), US-10 (modèle d'accès/sélection)
- **Priority**: 10

---

## Ranking method

Classement par ratio valeur/effort décroissant, en respectant les dépendances (une story n'est classée qu'une fois ses prérequis satisfaits ; parmi les stories déjà prêtes, celle au meilleur ratio est choisie en premier). En cas d'égalité de ratio, la story au niveau d'impact le plus faible passe devant.

**Priority order**: US-01 → US-02 → US-05 → US-06 → US-03 → US-04 → US-07 → US-09 → US-10 → US-12 → US-08 → US-11

- US-04 a été classée juste avant US-10 malgré un ratio et un niveau d'impact identiques (tous deux "critic", ratio 0.625), car US-07, US-09 et US-11 dépendent toutes de US-04 alors que seule US-12 dépend de US-10 — débloquer US-04 en premier libère trois stories en aval au lieu d'une.
