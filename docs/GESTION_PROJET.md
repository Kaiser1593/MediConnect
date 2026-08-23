# Gestion de projet

Ce document reconstitue la planification et le suivi réels du
développement de MediConnect à partir de l'historique Git (`git log`),
plutôt que d'un planning réécrit a posteriori pour paraître idéal. Les
dates et le contenu de chaque sprint sont ceux effectivement commités.

## Méthodologie

Développement en sprints courts (quelques jours à une semaine), inspirés
des principes Agile évoqués dans le dossier : un objectif fonctionnel
concret par sprint, livré et commité avant de passer au suivant, plutôt
qu'un plan détaillé figé en début de projet. Projet à développeur unique :
pas de cérémonie d'équipe (mêlée quotidienne, planning poker), mais le
principe d'itération courte et de livraison incrémentale est conservé.

## Découpage en sprints (dates réelles, `git log`)

| Sprint | Période | Objectif |
|---|---|---|
| 1 — Cadrage et amorçage | 26–27 juillet 2026 | Poser les fondations : structure frontend et backend, premières routes d'authentification, schéma de base initial |
| 2 — Authentification et démonstration | 28 juillet – 5 août 2026 | Connecter les formulaires à l'API, finaliser le backend d'authentification, produire des interfaces de démonstration pour les trois rôles |
| 3 — Cœur fonctionnel | 17–18 août 2026 | Schéma MySQL définitif, authentification bcrypt/JWT, comptes administrateur, recherche et réservation de médecin, tableaux de bord patient/médecin, agenda |
| 4 — Fiabilisation et fonctionnalités transverses | 19–20 août 2026 | Conteneurisation Docker, avis, modification de rendez-vous, mot de passe oublié (e-mail), corrections |
| 5 — Conformité, sécurité et finitions | 22–23 août 2026 | Renommage du schéma en français, journaux de sécurité, durcissement sécurité, documentation, corrections de bugs, améliorations admin/patient |

## Suivi : planifié / réalisé / écart

| Sprint | Planifié | Réalisé | Écart |
|---|---|---|---|
| 1 | Fondations frontend/backend + auth de base | Conforme | Aucun |
| 2 | Backend d'authentification finalisé + démonstration | Conforme, mais livré en fin de période plutôt qu'en continu | **Retard assumé** : répartition inégale du temps consacré au projet sur cette période (28 juillet – 17 août), avec un ralentissement visible dans l'historique Git avant le sprint 3 |
| 3 | Fonctionnalités cœur (réservation, dashboards) | Conforme, en un sprint concentré | Rattrapé : le retard du sprint 2 a été absorbé en resserrant le sprint 3 sur l'essentiel (schéma + auth + réservation), plutôt qu'en repoussant la date de fin de projet |
| 4 | Docker + fonctionnalités transverses | Conforme | Aucun |
| 5 | Conformité au dossier + sécurité + documentation | Conforme | Aucun |

**Retard assumé** : le sprint 2 a pris plus de temps que prévu (le
backend d'authentification et les interfaces de démonstration, planifiés
sur quelques jours, ont occupé la période du 28 juillet au 5 août, avec
un nouveau ralentissement jusqu'au 17 août avant le sprint suivant). Ce
retard a été absorbé sans décaler la date de fin du projet, en resserrant
le sprint 3 sur les fonctionnalités strictement nécessaires au parcours
utilisateur principal (recherche, réservation, tableaux de bord), et en
reportant au sprint 5 tout ce qui relevait de la conformité et de la
documentation plutôt que du cœur fonctionnel.

## Procédures qualité

- **Tests automatisés en intégration continue** : `.github/workflows/ci.yml`
  exécute à chaque push/pull request le lint frontend, les tests frontend
  (Vitest) et backend (Jest, unitaires + intégration Supertest contre une
  vraie base MySQL), et le build frontend. Un rapport de couverture
  backend est publié en artefact (voir "Contribuer à la mise en
  production" dans `docs/DEPLOIEMENT.md`).
- **Linter** : ESLint côté frontend et backend (`npm run lint` dans
  chaque dossier), chacun avec son propre job dans la CI
  (`lint-frontend`, `lint-backend`).
- **Revue de code** : projet à développeur unique — pas de revue par les
  pairs au sens strict, mais chaque changement est validé par l'exécution
  locale de la suite de tests avant commit, et la CI agit comme un
  second filet (aucun push ne doit casser le lint, les tests ou le
  build). Les erreurs trouvées en cours de développement (voir
  `database/CHANGELOG.md` pour un exemple concret, la restauration d'un
  compte supprimé par erreur) sont documentées plutôt que masquées.
- **Convention de commit** : messages courts en français, à l'indicatif
  ou au nom, décrivant le changement fonctionnel livré (ex. "avis, modif
  rdv, activité récente", "bdd en français, journaux de sécu") — pas de
  préfixe normé type Conventional Commits, choix assumé pour un projet
  solo où la granularité fonctionnelle du message compte plus que sa
  machine-lisibilité.

## Outils collaboratifs

| Outil | Usage | Justification |
|---|---|---|
| Git | Versionnage, historique de décisions | Standard de fait, nécessaire quelle que soit la méthode de développement |
| GitHub | Hébergement du dépôt, exécution de la CI (GitHub Actions) | Intégration native de l'intégration continue sans infrastructure à maintenir ; gratuit pour un dépôt de projet étudiant |
| GitHub Actions | CI : lint, tests, build à chaque push | Cohérent avec un développement en petites itérations : chaque sprint livré est vérifié automatiquement, pas seulement testé manuellement en fin de projet |

Pas d'outil de suivi de tickets (GitHub Issues, Trello...) mis en place :
sur un projet à développeur unique et sprints courts, l'historique Git
(un commit = une fonctionnalité livrée) fait office de journal de
suivi, plus fidèle à l'avancement réel qu'un tableau de tickets tenu en
parallèle. Ce choix serait à revoir pour une équipe de plusieurs
personnes, où la coordination ne peut plus reposer sur un seul historique
linéaire.
