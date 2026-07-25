# Carnet de Santé du Logement — MVP (V1)

Une plateforme qui transforme le Carnet d'Information du Logement (CIL), obligatoire depuis 2023 mais quasi jamais rempli, en un carnet de santé numérique de la maison alimenté automatiquement par les artisans lors de leurs interventions.

## Overview

Le CIL est encadré par la loi Climat et Résilience (2021) et obligatoire pour les logements neufs post-2023 et les logements rénovés avec incidence énergétique. Aucune plateforme n'est imposée par la loi : le CIL peut être un classeur papier, une clé USB ou un PDF, et il n'existe aujourd'hui aucun acteur en position de standard de facto. Le produit ne se positionne pas comme un outil de conformité réglementaire, mais comme un carnet de santé de la maison dont la valeur perçue (tranquillité d'esprit, valorisation à la revente, preuve de garanties) dépasse largement l'obligation légale. L'adoption est pensée pour être tirée par les artisans, qui ont un intérêt immédiat à digitaliser leur propre facturation et leurs attestations, plutôt que par le propriétaire, peu motivé à saisir spontanément son historique. Les agences immobilières impliquées dans une vente ou une location peuvent consulter le carnet en lecture seule lorsque le propriétaire leur en accorde l'accès ; elles ne saisissent ni ne modifient jamais son contenu.

## Problem Statement

Les propriétaires n'ont aucune raison spontanée de numériser leur historique de travaux malgré l'obligation légale, d'où un taux d'adoption réel très faible du CIL. Les informations existent pourtant (factures, attestations décennales, DPE, garanties) mais restent dispersées entre artisans, notaires, assureurs et le propriétaire lui-même, sans point de centralisation fiable. Un précédent dispositif similaire (carnet numérique du logement, loi Elan 2018) a été censuré par le Conseil constitutionnel en 2019 pour atteinte au droit de propriété et incompatibilité RGPD — toute solution doit intégrer cette contrainte dès sa conception, pas en rattrapage.

## Goals

- Une fiche logement pérenne peut être créée à partir d'une adresse, avec import automatique du DPE ADEME quand il est disponible, et reste attachée au bien indépendamment du propriétaire (portable en cas de vente).
- Un artisan peut déclarer une intervention (upload facture + saisie assistée) et voir son statut RGE et son assurance décennale vérifiés et horodatés automatiquement à la date de l'intervention.
- Une intervention déclarée par un artisan est automatiquement rattachée à la fiche logement du client concerné (ou en crée une), avec notification du propriétaire.
- Le propriétaire dispose d'une vue chronologique de toutes les interventions et d'un contrôle explicite, granulaire et révocable sur qui peut consulter tout ou partie de son carnet.
- Des rappels d'entretien sont générés automatiquement à partir des équipements déclarés, avec notification email/app.
- Le propriétaire peut générer un export (PDF/lien) présentable à un tiers, en choisissant les informations incluses.
- Succès mesuré via : nombre de fiches logement créées/mois, % créées automatiquement via facture artisan (vs saisie manuelle), nombre d'artisans actifs mensuels, taux de rétention à 6 mois côté artisan, nombre d'exports "dossier de vente" générés, taux d'ouverture des rappels d'entretien.
- Une agence immobilière à qui le propriétaire a accordé un accès peut consulter le carnet du logement en lecture seule, sans aucune capacité de modification.
- Un propriétaire peut saisir lui-même une intervention (type de travaux, date, montant, corps de métier, facture optionnelle) sans dépendre d'un artisan qui l'aurait fait à sa place.

## Non-Goals

- Connecteurs directs avec les logiciels artisans existants (Obat, Batappli, Costructor) — prévus en V2.
- Application mobile (artisan ou propriétaire) — prévue en V2, le MVP reste web responsive mobile-first.
- Score de confiance du logement (complétude, régularité d'entretien, ancienneté des équipements) — prévu en V2.
- API de consultation payante pour les tiers de confiance (assureurs, agences immobilières) — prévue en V2.
- Suivi de performance énergétique réelle via les données Enedis/GRDF (Linky) — prévu en V2.
- Marketplace de mise en relation propriétaire ↔ artisan pour l'entretien recommandé — prévue en V3.
- Intégration automatique avec les plateformes notariales — prévue en V3.
- Partenariats assurance (réduction de prime, traitement accéléré des sinistres) — prévus en V3.
- Consultation directe du carnet par un tiers de confiance sans lien explicite transmis par le propriétaire : en V1, l'unique accès tiers passe par un export contrôlé, jamais par un accès permanent ou par défaut.
- Système de notation ou de score propriétaire des artisans : explicitement exclu, la vérification RGE/décennale doit rester factuelle et sourcée, jamais un jugement propriétaire de la plateforme.
- Un accès en écriture ou en gestion pour une agence immobilière : son rôle reste strictement consultatif, jamais une saisie ou une modification du carnet.
- Gestion multi-biens sous un compte unique (type SCI, investisseur, multi-propriétaire) — prévue en V2 ; le MVP scope un compte propriétaire à un seul bien.
- Vue "carnet d'adresses" consolidée pour une agence sur l'ensemble de ses biens en mandat (vente/location) — prévue en V2 ; en V1 l'agence consulte un carnet à la fois, via l'accès accordé individuellement par chaque propriétaire.

## User Stories

- En tant que propriétaire, je veux qu'une fiche logement soit créée automatiquement quand un artisan facture une intervention chez moi, afin de ne pas avoir à saisir moi-même mon historique de travaux.
- En tant que propriétaire, je veux recevoir une notification quand une intervention est ajoutée à mon carnet, afin de découvrir et compléter ma fiche sans effort initial.
- En tant que propriétaire, je veux consulter la vue chronologique de toutes les interventions sur mon logement avec leurs attestations horodatées, afin d'avoir une preuve fiable de l'entretien de mon bien.
- En tant que propriétaire, je veux choisir précisément qui peut consulter tout ou partie de mon carnet, afin de garder le contrôle total de mes données personnelles.
- En tant que propriétaire, je veux recevoir des rappels d'entretien basés sur mes équipements déclarés, afin de ne pas oublier un entretien obligatoire ou recommandé (chaudière, ramonage, VMC).
- En tant que propriétaire, je veux générer un export PDF/lien de mon carnet en contrôlant les informations incluses, afin de le présenter à un notaire, un acheteur ou un assureur au moment de la revente.
- En tant qu'artisan, je veux uploader une facture et saisir rapidement le type de travaux, afin de digitaliser ma facturation sans changer mes habitudes de travail.
- En tant qu'artisan, je veux que mon statut RGE et mon assurance décennale soient vérifiés et horodatés automatiquement à la date de l'intervention, afin d'avoir une preuve factuelle et opposable de mes garanties en cas de litige.
- En tant qu'artisan, je veux que l'intervention soit attribuée automatiquement à la bonne fiche logement de mon client, afin de ne pas avoir à gérer moi-même la mise en relation.
- En tant qu'artisan, je veux consulter mon propre historique d'interventions, afin de m'en servir comme book de références professionnel.
- En tant qu'agence immobilière à qui un propriétaire a donné accès, je veux consulter le carnet du logement en lecture seule, afin de renseigner un acquéreur ou un locataire sans solliciter le propriétaire à chaque question.
- En tant que propriétaire, je veux pouvoir saisir moi-même une intervention sur mon logement, afin de compléter mon carnet même quand mon artisan n'utilise pas (encore) la plateforme.

## Acceptance Criteria

- Une fiche logement peut être créée à partir d'une adresse ; si un DPE existe dans les données ADEME pour cette adresse, il est importé automatiquement.
- Une fiche logement reste consultable et modifiable indépendamment de tout changement de propriétaire.
- Un artisan peut soumettre une intervention avec facture PDF, type de travaux, date, montant et corps de métier ; les photos avant/après sont possibles mais non obligatoires.
- Le statut RGE et l'assurance décennale de l'artisan sont vérifiés et horodatés à la date de l'intervention avant validation de celle-ci.
- L'intervention est rattachée à la fiche logement existante du client, ou une nouvelle fiche est créée si aucune ne correspond, avec notification email au propriétaire dans les deux cas.
- Le propriétaire peut voir, pour chaque intervention de sa fiche, l'artisan, la date, le type de travaux et les attestations associées horodatées.
- Le propriétaire peut accorder ou révoquer un accès (total ou partiel) à son carnet, sans partage automatique par défaut à un tiers.
- Des rappels d'entretien sont générés automatiquement à partir des équipements déclarés sur la fiche et notifiés par email.
- Le propriétaire peut générer un export PDF ou un lien de synthèse en choisissant les informations incluses.
- Aucune information du carnet n'est consultable par un tiers sans action explicite et révocable du propriétaire.
- Une agence disposant d'un accès accordé par le propriétaire peut consulter le carnet en lecture seule ; aucune action de modification n'est disponible depuis son interface.
- Un propriétaire peut créer une intervention manuellement (mêmes champs qu'une saisie artisan) sans qu'un artisan ne l'ait préalablement renseignée.

## Dependencies

- Accès à l'API ADEME/France Rénov pour la vérification du statut RGE des artisans.
- Accès aux données DPE de l'ADEME pour l'import automatique lors de la création de fiche.
- Un service de vérification de l'assurance décennale des artisans à la date de l'intervention (aucune API publique confirmée à ce jour — voir Open Questions).
- Recrutement d'un premier groupe d'artisans pilotes (20-50, zone géographique limitée, ex. Loire-Atlantique) pour amorcer le flux facture → fiche logement.
- Cadrage juridique RGPD/CCH avec un avocat spécialisé avant toute collecte de données réelles.

## Open Questions

- Quel service ou processus fiable permet de vérifier l'assurance décennale d'un artisan à une date donnée, en l'absence de registre public officiel équivalent à celui du RGE ?
- Comment gérer le cas où un artisan facture un client qui n'a pas encore de compte propriétaire (email/téléphone seul disponible) — jusqu'à quel point la fiche reste-t-elle "orpheline" avant réclamation par le propriétaire ?
- Quel est le contenu minimal légalement attendu du CIL par le Code de la Construction et de l'Habitation, pour s'assurer que le MVP le couvre bien ?
- Quelle granularité de contrôle d'accès propriétaire (par intervention, par artisan, par période) permet de rester clairement "un outil au service du propriétaire" sans risquer la requalification juridique qui a fait censurer le dispositif de 2018 ?
- Faut-il permettre au propriétaire de corriger ou contester une intervention déclarée par un artisan, et selon quel processus ?
