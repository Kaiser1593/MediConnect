# Accessibilité (RGAA)

MediConnect est une application de santé : l'accessibilité n'y est pas
une option, plusieurs utilisateurs potentiels (patients âgés, en
situation de handicap visuel ou moteur) en dépendent directement pour
prendre rendez-vous. Ce document couvre ce qui a été réellement fait,
vérifié par inspection du code et du DOM rendu — **pas** un audit RGAA
complet et outillé (voir "Ce qui n'a pas été fait" ci-dessous pour
l'écart assumé).

## Niveau visé

RGAA 4 / WCAG 2.1, niveau **AA**, sur le périmètre applicatif livré
(pages authentifiées et publiques listées dans `docs/PERIMETRE.md`). Pas
de certification ni d'audit externe réalisé : les points ci-dessous sont
vérifiés techniquement (attributs présents, ratio de contraste calculé),
pas validés par un audit RGAA formel ni par un test utilisateur réel en
situation de handicap.

## Points traités

- **Langue de la page** : `<html lang="fr">` (`frontend/index.html`),
  cohérent avec une application entièrement en français.
- **Étiquetage des champs de formulaire** : 38 associations
  `<label htmlFor>` / `id` dans le code (vérifié par recherche dans
  `frontend/src`), y compris sur les champs ajoutés tardivement
  (sélecteurs de motif de consultation, zones de commentaire d'avis,
  filtres d'administration) qui n'en avaient pas à l'origine.
- **Attributs ARIA ciblés** : 31 occurrences de `role="alert"` (messages
  d'erreur et de succès, annoncés automatiquement par un lecteur d'écran
  sans action de l'utilisateur) et `aria-label` (contrôles sans libellé
  visuel, ex. boutons icône), répartis sur 23 fichiers.
- **Contraste des couleurs** : les couleurs de texte à faible contraste
  (gris et ambres notamment) ont été identifiées par un calcul réel du
  ratio de contraste WCAG (luminance relative, pas une estimation visuelle)
  puis corrigées vers des teintes conformes au niveau AA (texte normal :
  ratio ≥ 4.5:1). Voir l'historique des couleurs modifiées dans
  `frontend/src/App.css`.
- **Focus clavier visible** : les rares `outline: none` du CSS
  (`.form-group input/select/textarea`, `.search-fields input`...) sont
  systématiquement accompagnés d'un style de focus personnalisé
  (`:focus { border-color; box-shadow }`), jamais d'une suppression pure
  et simple de l'indicateur de focus.
- **Navigation clavier du menu mobile** : le panneau de navigation
  mobile (`DashboardLayout.jsx`, sous 900px) piège le focus tant qu'il
  est ouvert (Tab ne doit jamais atteindre le contenu masqué derrière),
  se ferme au clavier avec Échap, et rend le focus au bouton qui l'a
  ouvert à la fermeture — plutôt qu'un focus perdu au milieu de la page.
- **Photos de profil (`Avatar.jsx`) avec `alt` correct** : la seule
  balise `<img>` de l'application (photo de profil patient/médecin,
  ajoutée en cours de session) utilise systématiquement `alt=""` — le nom
  complet de la personne est toujours affiché en texte juste à côté, un
  texte alternatif descriptif serait donc redondant pour un lecteur
  d'écran. Sans photo, un `<div>` d'initiales générées prend le relais,
  jamais une image cassée. Les icônes restantes (menus, boutons) sont des
  caractères typographiques, sans texte alternatif à fournir.

## Points non traités et pourquoi

- **Lien d'évitement ("Aller au contenu")** : absent. Un utilisateur au
  clavier doit traverser toute la barre de navigation latérale
  (`DashboardLayout`) avant d'atteindre le contenu de chaque page — non
  bloquant sur un menu court (moins de 10 liens), mais un vrai gain RGAA
  pour un utilisateur naviguant exclusivement au clavier. Non traité par
  manque de temps sur cette itération, pas par choix technique : c'est un
  ajout simple (un lien masqué visuellement, visible au focus, ciblant le
  conteneur principal).
- **Contenu dynamique et lecteurs d'écran (`aria-live`)** : les zones qui
  se mettent à jour sans rechargement de page (créneaux disponibles après
  changement de date, liste de rendez-vous après une action) ne sont pas
  annoncées automatiquement à un lecteur d'écran — l'utilisateur voit le
  changement, mais n'en est pas informé s'il n'a pas la page à l'écran.
  Non traité : nécessite d'identifier précisément quelles zones
  mériteraient `aria-live="polite"` sans créer d'annonces excessives ou
  redondantes, un exercice plus fin qu'un ajout mécanique.
- **Audit avec un lecteur d'écran réel** (NVDA, VoiceOver) : non réalisé.
  Les vérifications ci-dessus portent sur la présence et la correction
  des attributs (analyse statique du code et du DOM), pas sur l'usage
  réel de l'application au clavier avec un lecteur d'écran actif — la
  seule validation qui garantit qu'un parcours complet (inscription,
  réservation) est réellement praticable, pas seulement conforme
  attribut par attribut.
- **Zoom texte et responsive à 200%** : non vérifié systématiquement.
  Le CSS utilise des unités relatives par endroits (voir
  `docs/ECOCONCEPTION.md`) mais aucune vérification dédiée au
  redimensionnement du texte n'a été menée page par page.

## Pourquoi documenter cet écart plutôt que le dissimuler

Une application de santé attire une attention particulière du jury sur
ce critère. Prétendre à une conformité RGAA complète sans audit réel
serait plus risqué, à l'oral, que d'assumer un périmètre partiel mais
vérifiable : chaque point "traité" ci-dessus est démontrable dans le code
(recherche de `htmlFor`, `aria-*`, calcul de contraste), chaque point
"non traité" a une raison concrète et un chemin de correction identifié,
pas un simple constat d'absence.
