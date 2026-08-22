# Conformité RGPD

MediConnect traite des données de santé à caractère personnel (identité,
coordonnées, rendez-vous médicaux, avis). C'est la surface la plus
exposée du projet : ce document décrit les mesures réellement
implémentées, pas une déclaration de conformité de façade.

## Base légale

- **Compte utilisateur** (identité, e-mail, mot de passe) : exécution du
  contrat (fournir le service de prise de rendez-vous), article 6.1.b du
  RGPD.
- **Données de rendez-vous** (motif, historique) : exécution du contrat,
  nécessaires au suivi de la relation patient-médecin.
- **Consentement explicite** recueilli en complément à l'inscription (case
  à cocher obligatoire, voir plus bas) : couvre l'acceptation des
  conditions d'utilisation et de la politique de confidentialité.

## Minimisation

Le formulaire d'inscription ne demande que les champs strictement
nécessaires à la création du compte (nom, prénom, e-mail, mot de passe,
type de compte). Les informations plus sensibles (date de naissance,
adresse, genre) sont demandées séparément, dans le profil, et restent
facultatives côté patient (`patients.date_naissance`, `patients.genre`,
`patients.adresse` sont `NULL`-able). Le numéro RPPS d'un médecin est une
donnée professionnelle publique (registre national), pas une donnée
personnelle sensible.

## Chiffrement

- **Mots de passe** : jamais stockés en clair, hachés avec `bcrypt`
  (12 rounds, voir `backend/utils/hashPassword.js`).
- **Jetons de réinitialisation de mot de passe** : le jeton en clair
  n'existe que dans le lien envoyé par e-mail ; seul son hachage SHA-256
  est stocké (`reinitialisations_mot_de_passe.jeton_hache`).
- **Transport** : HTTPS en production (non simulable en local ; Helmet
  ajoute `Strict-Transport-Security` dès aujourd'hui, voir
  `backend/app.js`).
- **Au repos** : pas de chiffrement applicatif de la base MySQL elle-même
  dans cette version ; en production réelle, ce serait le rôle du chiffrement
  au niveau du disque/volume (transparent pour l'application), cohérent
  avec une hébergement HDS (voir plus bas).

## Durées de conservation

| Donnée | Durée | Mécanisme |
|---|---|---|
| Compte utilisateur actif | Tant que le compte existe | — |
| `journaux_securite` (connexions, accès refusés...) | Pas de purge automatisée dans cette version | Point d'extension identifié : un job planifié (`DELETE ... WHERE date_evenement < NOW() - INTERVAL 1 YEAR`) serait la prochaine étape avant une mise en production réelle. |
| Jetons de réinitialisation de mot de passe | 1 heure, codée en dur (`RESET_TOKEN_TTL_MS`, `authService.js`) | Vérifiée à la lecture (`passwordResetModel.findValidByTokenHash`), jamais purgée physiquement mais toujours inutilisable après expiration. |
| Compte supprimé par l'utilisateur | Anonymisé immédiatement, conservé indéfiniment sous forme anonyme | Voir "Droit à l'effacement" ci-dessous. |

## Mention HDS (Hébergement de Données de Santé)

Le RDV médical et le motif de consultation sont des données de santé au
sens du RGPD. Une mise en production réelle en France impose un
hébergement chez un prestataire certifié **HDS** (Hébergeur de Données de
Santé, certification obligatoire, encadrée par l'ANS). Ce n'est pas
implémenté ni implémentable dans un contexte de développement local : la
mention explicite ici évite de laisser croire que ce prérequis légal est
satisfait.

## Droits mis en œuvre

### Consentement à l'inscription

La case à cocher "J'accepte les conditions d'utilisation et la politique
de confidentialité" du formulaire d'inscription (`Register.jsx`) est
obligatoire côté navigateur (`required`) **et** revérifiée côté serveur
(`authController.registerUser` rejette toute inscription sans
`consent: true`, 400). L'horodatage du consentement est persisté
(`utilisateurs.consentement_rgpd_le`), pas seulement coché puis oublié.

### Droit d'accès (export des données)

`GET /api/auth/me/export` (authentifié) renvoie l'intégralité des données
personnelles détenues sur l'utilisateur connecté : compte, profil
(patient ou médecin), rendez-vous, avis rédigés, notifications — au
format JSON, en téléchargement direct depuis l'interface (bouton
"Télécharger mes données", visible sur les pages de profil patient et
médecin).

### Droit à l'effacement (suppression de compte)

`DELETE /api/auth/me` (authentifié) supprime le compte à la demande de
l'utilisateur. **Anonymisation plutôt que suppression physique** : nom,
prénom et e-mail sont remplacés par des valeurs non identifiantes, le mot
de passe par un hachage aléatoire inutilisable, le compte est suspendu.
Les données de profil (adresse, date de naissance, biographie...) sont
effacées. Un médecin anonymisé disparaît de la recherche publique
(`medecins.est_valide` repassé à `FALSE`).

La ligne `utilisateurs` n'est **jamais supprimée physiquement** : les
tables `patients`/`medecins` sont liées par `ON DELETE CASCADE`, qui
supprimerait en cascade tous les rendez-vous et avis rattachés — y
compris ceux qui appartiennent à l'historique de l'autre partie (le
médecin garde une trace de ses consultations passées, même si le patient
a supprimé son compte, et inversement). Anonymiser préserve cette
continuité tout en retirant les données personnelles identifiantes,
conformément à l'esprit du droit à l'effacement (qui porte sur les
données personnelles, pas sur la disparition de tout enregistrement).

Le token JWT en cours est immédiatement révoqué (liste noire Redis, voir
`docs/ECOCONCEPTION.md`), et l'événement est journalisé
(`journaux_securite`, type `COMPTE_ANONYMISE`) sans jamais inclure de
donnée personnelle dans le message de journal.
