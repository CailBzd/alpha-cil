# Cahier des charges — Carnet de Santé du Logement (CIL nouvelle génération)

**Version :** 0.1 — Document de travail
**Date :** Juillet 2026
**Statut :** Draft pour cadrage projet / recherche de traction

---

## 1. Contexte et opportunité

### 1.1 Constat réglementaire
Le Carnet d'Information du Logement (CIL) est obligatoire depuis le 1er janvier 2023 pour :
- tous les logements neufs dont le permis de construire est postérieur au 1er janvier 2023 ;
- tous les logements existants faisant l'objet de travaux ayant une incidence sur la performance énergétique.

Il est encadré par les articles L126-35-2 à L126-35-11 du Code de la Construction et de l'Habitation, issus de la loi Climat et Résilience du 22 août 2021.

**Particularité clé :** aucune plateforme n'est imposée. Le CIL peut légalement être un classeur papier, une clé USB ou un simple dossier PDF. Il n'existe donc aujourd'hui aucun acteur en position de standard de facto.

### 1.2 Le problème réel
- Le CIL est perçu comme une contrainte administrative sans valeur immédiate perçue → très faible taux d'adoption réel malgré l'obligation légale.
- Les propriétaires n'ont aucune raison spontanée de numériser leur historique de travaux.
- Les informations existent (factures, attestations décennales, DPE, garanties) mais sont dispersées entre artisans, notaires, assureurs, et le propriétaire lui-même.
- Un précédent dispositif similaire (carnet numérique du logement, loi Elan 2018) a été censuré par le Conseil constitutionnel en 2019 pour atteinte au droit de propriété et incompatibilité RGPD — contrainte de conception à respecter dès le départ.

### 1.3 La thèse produit
Ne pas vendre un outil de conformité, mais un **carnet de santé de la maison** dont la valeur perçue dépasse largement l'obligation légale :
- tranquillité d'esprit pour le propriétaire,
- preuve de sérieux et différenciation pour l'artisan,
- vérification instantanée pour les tiers de confiance (notaire, assureur, acheteur).

L'adoption ne doit pas reposer sur le propriétaire (peu motivé), mais être **tirée par les artisans**, qui ont un intérêt immédiat à l'utiliser pour digitaliser leur propre facturation et attestations.

---

## 2. Objectifs du produit

| Objectif | Indicateur de succès |
|---|---|
| Devenir la référence de facto du CIL numérique en France | Part de marché parmi les CIL numériques actifs |
| Créer un usage récurrent (pas un outil one-shot) | Fréquence de connexion / notifications ouvertes |
| Générer un effet réseau artisan → propriétaire | Nombre de CIL créés automatiquement via facture artisan |
| Devenir un critère de valorisation immobilière reconnu | Nombre de CIL exportés/consultés lors de transactions |

---

## 3. Utilisateurs cibles

### 3.1 Propriétaire (particulier)
- Profil : propriétaire occupant ou bailleur, ayant réalisé ou envisageant des travaux.
- Motivation principale : tranquillité d'esprit, valorisation du bien à la revente.
- Frein principal : pas de temps/motivation à saisir des informations sans bénéfice immédiat.

### 3.2 Artisan / maître d'œuvre (professionnel)
- Profil : TPE du bâtiment (RGE ou non), maître d'œuvre indépendant.
- Motivation principale : gain de temps administratif, image professionnelle, preuve de garanties en cas de litige.
- Frein principal : encore un outil à apprendre, réticence à changer d'habitudes si pas intégré à son logiciel existant.

### 3.3 Tiers de confiance
- Notaire, agent immobilier, assureur, futur acquéreur.
- Motivation : vérifier rapidement l'historique et la fiabilité d'un bien sans multiplier les appels.
- Utilisateur non payant en phase 1, cible de monétisation en phase 2/3.

---

## 4. Périmètre fonctionnel

### 4.1 MVP (Version 1)

**Fiche logement**
- Création de la fiche à partir de l'adresse (import DPE ADEME si disponible).
- Champs : surface, année de construction, type de chauffage, matériaux, DPE.
- Un logement = une fiche pérenne, indépendante du compte propriétaire (portable en cas de vente).

**Ajout d'intervention côté artisan**
- Interface web simple : upload facture (PDF) + saisie assistée (type de travaux, date, montant, corps de métier).
- Vérification automatique du statut RGE et de l'assurance décennale de l'artisan à la date de l'intervention (via API ADEME/ServicesArtisans pour le RGE ; connexion à un service de vérification décennale pour la partie assurance).
- Attribution automatique de l'intervention à la fiche logement du client (recherche par adresse ou email/téléphone du client).
- Photos avant/après (optionnel mais encouragé).

**Espace propriétaire**
- Vue chronologique de toutes les interventions sur le logement.
- Consultation des attestations (RGE, décennale) associées à chaque intervention, horodatées.
- Gestion des accès : le propriétaire choisit qui peut consulter tout ou partie du carnet (contrôle RGPD).

**Rappels d'entretien**
- Génération automatique de rappels basés sur les équipements déclarés (ex. entretien chaudière annuel, ramonage, contrôle VMC).
- Notification email/app.

**Export dossier**
- Génération d'un PDF/lien de synthèse présentable (pour notaire, acheteur, assureur).
- Contrôle du propriétaire sur les informations incluses dans l'export.

### 4.2 V2 — Après validation du MVP

- Connecteurs directs avec les logiciels artisans existants (Obat, Batappli, Costructor...) pour pousser les factures automatiquement sans ressaisie.
- Application mobile (côté artisan en priorité, pour la saisie terrain).
- Score de confiance du logement (complétude du carnet, régularité de l'entretien, ancienneté des équipements).
- API de consultation pour tiers de confiance (assureurs, agences immobilières) — première brique de monétisation B2B2C.
- Suivi de performance énergétique réelle (relevés de consommation vs promesses initiales) — connexion possible aux données Enedis/GRDF (Linky).

### 4.3 V3 — Vision long terme

- Marketplace de mise en relation propriétaire ↔ artisan pour l'entretien recommandé (commission).
- Intégration avec les plateformes notariales pour inclusion automatique du CIL dans le dossier de vente.
- Partenariats assurance : réduction de prime ou traitement accéléré des sinistres pour les logements avec carnet complet et à jour.

---

## 5. Parcours utilisateurs clés

### 5.1 Parcours artisan (point d'entrée principal)
1. L'artisan termine un chantier et facture son client via son outil habituel ou directement dans l'app.
2. Il envoie la facture (upload ou connecteur automatique en V2).
3. Le système vérifie et horodate son statut RGE/décennale.
4. Une fiche logement est créée ou mise à jour automatiquement pour le client, avec un email de notification.
5. L'artisan a accès à son propre historique d'interventions comme book de références.

### 5.2 Parcours propriétaire (découverte passive puis engagement actif)
1. Réception d'un email : "Un artisan a ajouté une intervention à votre carnet logement."
2. Découverte de sa fiche déjà partiellement remplie.
3. Complète les informations manquantes (équipements, DPE si non importé).
4. Reçoit des rappels d'entretien dans le temps → usage récurrent.
5. Au moment de la revente : génère l'export en un clic.

### 5.3 Parcours tiers de confiance (V2)
1. Reçoit un lien de consultation du propriétaire (contrôle total du partage).
2. Consulte l'historique vérifié sans avoir à contacter chaque artisan individuellement.

---

## 6. Contraintes réglementaires et éthiques

- **RGPD strict** : le propriétaire doit garder le contrôle total sur qui accède à quoi. Pas de partage automatique avec des tiers (assureurs notamment) sans consentement explicite et révocable.
- **Pas de conception qui pourrait être requalifiée en atteinte au droit de propriété** — s'inspirer des raisons de la censure du carnet numérique de 2018 : rester un outil au service du propriétaire, jamais un fichier consultable par défaut par des tiers.
- **Conformité aux exigences légales du CIL** (contenu minimal attendu par le CCH) sans s'y limiter.
- **Neutralité vis-à-vis des artisans** : la vérification RGE/décennale doit être factuelle et sourcée (organismes officiels), pas un système de notation propriétaire qui pourrait être contesté juridiquement.

---

## 7. Architecture technique (haut niveau)

| Composant | Description |
|---|---|
| Frontend propriétaire | Application web responsive (mobile-first) |
| Frontend artisan | Interface web MVP, application mobile en V2 |
| Backend | API REST, gestion des fiches logement, comptes, permissions |
| Intégrations externes | API ADEME/France Rénov (RGE), service de vérification décennale, DPE (ADEME), connecteurs logiciels artisans (V2), Enedis/GRDF (V2) |
| Stockage documents | Hébergement des factures/attestations (conformité RGPD, hébergement en France recommandé) |
| Notifications | Email transactionnel + push (V2 mobile) |

---

## 8. Modèle économique

| Segment | Modèle |
|---|---|
| Propriétaire | Gratuit (levier d'acquisition et de rétention, pas de monétisation directe en V1) |
| Artisan | Freemium : gratuit jusqu'à un volume de factures/mois, payant au-delà ; vérification RGE/décennale en option premium |
| Tiers de confiance (V2) | API de consultation payante à l'usage ou à l'abonnement (assureurs, agences) |
| Marketplace entretien (V3) | Commission sur mise en relation |

---

## 9. Stratégie de traction (go-to-market)

1. **Phase 1 — Artisans pilotes** : recruter 20-50 artisans dans une zone géographique limitée (ex. Loire-Atlantique) pour valider le flux facture → fiche logement.
2. **Phase 2 — Partenariat logiciel** : négocier une intégration ou un partenariat avec un éditeur de logiciel artisan existant (Obat, Batappli, Costructor) plutôt que de concurrencer frontalement sur la facturation.
3. **Phase 3 — Effet réseau propriétaire** : une fois qu'un volume critique de fiches logement existe, communiquer directement auprès des propriétaires sur la valeur de revente.
4. **Phase 4 — Tiers de confiance** : approcher notaires et assureurs une fois la base de logements suffisamment large pour représenter un intérêt statistique.

---

## 10. Risques identifiés

| Risque | Impact | Mitigation |
|---|---|---|
| Adoption lente côté artisans sans connecteur logiciel | Élevé | Prioriser un partenariat avec un éditeur existant dès le MVP |
| Défiance RGPD des propriétaires | Moyen | Transparence totale sur le contrôle des données, pas de partage par défaut |
| Absence de sanction légale réelle autour du CIL | Moyen | Ne pas fonder l'acquisition sur l'argument de conformité, mais sur la valeur perçue (revente, tranquillité) |
| Concurrence d'un acteur mieux capitalisé (assureur, notaire) qui lance sa propre solution | Moyen | Vitesse d'exécution et effet réseau artisan comme barrière à l'entrée |
| Qualité des données de vérification RGE/décennale (fraude, données obsolètes) | Élevé | Croiser plusieurs sources officielles, horodater systématiquement |

---

## 11. Indicateurs de succès (KPIs)

- Nombre de fiches logement créées / mois.
- % de fiches créées automatiquement via une facture artisan (vs création manuelle propriétaire).
- Nombre d'artisans actifs mensuels.
- Taux de rétention à 6 mois côté artisan.
- Nombre d'exports "dossier de vente" générés.
- Taux d'ouverture des rappels d'entretien.

---

## 12. Prochaines étapes suggérées

1. Valider l'intérêt côté artisans via des entretiens qualitatifs (10-15 artisans BTP, idéalement multi-corps de métier).
2. Prototyper le flux "upload facture → vérification RGE/décennale → fiche logement" sans développement lourd (Google Form + Airtable ou équivalent) pour tester la proposition de valeur avant d'investir en développement.
3. Identifier et contacter 2-3 éditeurs de logiciels artisans pour évaluer la faisabilité d'un partenariat d'intégration.
4. Étudier le cadre juridique précis (RGPD, CCH) avec un avocat spécialisé avant toute collecte de données réelles.

---

*Document de travail destiné à cadrer une phase d'exploration et de validation, non un plan d'affaires finalisé.*
