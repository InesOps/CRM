# CRM_PFE

Application CRM interne (projet de fin d'études) pour la gestion des contacts, prospects,
tâches, réunions et de l'équipe commerciale. Interface en français, mono-page, avec trois
rôles utilisateurs (administrateur, manager, commercial) qui partagent la même interface
mais voient des données et des actions différentes.

---

## Stack technique

| Couche | Technologie |
| --- | --- |
| Front-end | React 18 + TypeScript, [Vite](vite.config.ts) |
| UI | Tailwind CSS v4, composants [shadcn/ui](src/app/components/ui/) (Radix UI), MUI (ponctuel), `lucide-react` |
| Back-end | Firebase — Authentication, Cloud Firestore, Cloud Functions (Node 20) |
| Divers | `react-dnd` (kanban), `jspdf` (export PDF), `recharts` (graphiques), `next-themes` (thème clair/sombre) |

Il n'y a pas de serveur applicatif : le front parle directement à Firestore, et une seule
Cloud Function est utilisée pour les opérations qui exigent des droits admin.

---

## Démarrage

```bash
npm i          # installer les dépendances
npm run dev    # serveur de développement Vite
npm run build  # build de production dans dist/
```

La configuration Firebase est en clair dans [src/firebase/config.ts](src/firebase/config.ts)
(clés publiques côté client — la sécurité repose sur les règles Firestore et sur la
Cloud Function). Le projet Firebase cible est `crm-pfe`.

Déploiement des règles et des fonctions :

```bash
firebase deploy --only firestore:rules,functions
```

---

## Structure du code

```
src/
  main.tsx                     point d'entrée React
  app/
    App.tsx                    racine : auth, routage par module, garde-fou de rôle
    components/
      Sidebar.tsx              navigation, filtrée par rôle
      Dashboard.tsx            KPI + graphiques (vue perso ou globale)
      Contacts.tsx             clients / fournisseurs / partenaires
      Prospects.tsx            pipeline commercial + conversion en client
      Tasks.tsx                kanban personnel (drag & drop)
      GlobalTasks.tsx          tâches de toute l'équipe, assignation
      CalendarView.tsx         calendrier des réunions
      Projects.tsx             référentiel des projets
      StaffList.tsx            gestion de l'équipe, export PDF
      Profile.tsx              profil + statistiques personnelles
      SettingsModal.tsx        thème, compte, mot de passe
      LoginScreen.tsx          connexion e-mail / mot de passe
      ui/                      bibliothèque shadcn/ui (non modifiée)
  firebase/
    config.ts                  initialisation de l'app Firebase
    auth.ts                    login / logout / observateur d'état
    crud/                      un module par collection Firestore
  hooks/
    useAuth.ts                 utilisateur courant + rôle
    useDashboard.ts            agrégation des KPI du tableau de bord
functions/index.js             Cloud Function `deleteStaffMember`
scripts/renumber-contacts.mjs  migration ponctuelle des identifiants de contacts
firestore.rules                règles d'accès Firestore
```

---

## Authentification et rôles

La connexion se fait par e-mail / mot de passe avec persistance de **session** (fermer
l'onglet déconnecte) — voir [src/firebase/auth.ts](src/firebase/auth.ts).

[useAuth](src/hooks/useAuth.ts) écoute l'état Firebase Auth, lit le document
`users/{uid}` (créé automatiquement avec le rôle `agent` s'il n'existe pas) et le
recopie dans `staff/{uid}`. Cette collection miroir permet aux admins et managers de
lister toute l'équipe sans donner de droits de lecture élargis sur `users`.

Trois rôles : `admin`, `manager`, `agent` (affiché « Commercial »). L'ancien rôle
`user` est traduit en `agent` pour compatibilité.

Le contrôle d'accès est appliqué à deux endroits côté client :
[`isModuleAllowed`](src/app/App.tsx#L34-L42) dans `App.tsx` (un module non autorisé
retombe sur le tableau de bord) et le champ `roles` de chaque entrée de navigation
dans [Sidebar.tsx](src/app/components/Sidebar.tsx#L21-L31).

### Ce que chaque rôle peut faire

**Commercial (`agent`)**
- Tableau de bord **personnel** : ses clients, son chiffre d'affaires, ses tâches.
- Ne voit que les contacts et prospects qui lui sont assignés.
- Peut créer des prospects et les **convertir en clients** ; ne peut pas créer un client
  directement ni s'auto-assigner des contacts.
- Kanban de tâches personnel, calendrier avec réunions internes (choix des participants
  dans la liste du personnel).

**Manager**
- Tableau de bord **global** + statistiques par commercial.
- Voit et modifie tous les contacts et prospects, peut les **assigner** à un commercial.
- Calendrier global avec CRUD complet.
- « Tâches globales » : filtre par commercial, voit les tâches faites / en cours,
  et assigne de nouvelles tâches.
- Accède à la liste de l'équipe en **lecture seule** et exporte les fiches / statistiques
  d'un commercial en PDF.
- Gère le référentiel des projets.

**Administrateur** (un seul)
- Tout ce que fait le manager, plus le **CRUD complet sur l'équipe** : création de compte,
  modification du profil, changement de rôle, suppression.

---

## Modules fonctionnels

### Tableau de bord
Agrège Firestore côté client : chiffre d'affaires (somme des `DealValue` des clients),
contacts actifs, tâches en cours et en retard, répartition du pipeline par étape,
répartition des contacts par type, chiffre d'affaires par mois, prochaines réunions.
Pour les managers et l'admin, un tableau de statistiques par commercial est ajouté.
Le taux de change EUR → TND est récupéré depuis `api.frankfurter.app`, avec une valeur
de repli codée en dur si l'appel échoue.

### Contacts
Trois types : `client`, `fournisseur`, `partenaire`, chacun avec statut actif/inactif,
tags, services rattachés (`ServicePicker`), projets liés (`ProjectPicker`) et, pour les
clients, une valeur d'affaire. Identifiant lisible auto-incrémenté via un compteur
transactionnel (`counters/contacts`).

### Prospects
Pipeline à étapes (identification, qualification, proposition, négociation, gagné, perdu)
avec source, valeur, probabilité, prochaine action et assignation. La conversion crée un
contact de type `client` à partir du prospect.

### Tâches
`Mes tâches` est un kanban en glisser-déposer (`react-dnd`) avec priorités, échéances et
tags. `Tâches globales` est la vue managériale : sélection d'un membre, liste séparée
terminées / en cours, et modal d'assignation.

### Calendrier
Réunions typées (`meeting`, `call`, `demo`, `internal`) avec date, horaires, lieu, notes
et participants sélectionnés dans la liste du personnel.

### Équipe (StaffList)
Liste du personnel avec compteurs par rôle. L'admin crée un compte via
[`createStaffMember`](src/firebase/crud/users.ts) : une **instance Firebase secondaire**
et jetable est utilisée pour créer l'utilisateur sans déconnecter l'admin en cours.
La suppression passe par la Cloud Function. Export PDF de la liste et des fiches
individuelles avec `jspdf`.

### Profil & paramètres
Profil éditable avec statistiques personnelles ; modal de paramètres pour le thème
(clair / sombre / système), le compte et le changement de mot de passe (réauthentification
requise).

---

## Données (Firestore)

| Collection | Contenu |
| --- | --- |
| `users/{uid}` | profil complet + rôle (source pour l'utilisateur lui-même) |
| `staff/{uid}` | miroir allégé du profil, utilisé pour lister l'équipe |
| `contacts` | clients, fournisseurs, partenaires |
| `prospects` | pipeline commercial |
| `tasks` | tâches (`column`, `assignee` / `assignedTo`, priorité, échéance) |
| `calendar` | réunions |
| `projets` | référentiel de projets |
| `counters` | compteurs d'auto-incrément (`contacts`, `prospects`, `projets`) |

Chaque collection a son module CRUD dans [src/firebase/crud/](src/firebase/crud/). Les
identifiants lisibles (`contactId`, `prospectId`, `projectId`) sont générés par une
transaction Firestore sur le document compteur correspondant.

---

## Cloud Function

[`deleteStaffMember`](functions/index.js) — fonction *callable* qui supprime un membre
de Firebase Auth **et** ses documents `users` / `staff`. Le SDK client ne peut pas
supprimer le compte d'un autre utilisateur, d'où le passage par le back-end. Elle vérifie
que l'appelant est authentifié, que son document `staff` porte le rôle `admin`, et refuse
l'auto-suppression. Un compte Auth déjà absent n'est pas bloquant : les documents
Firestore sont nettoyés quand même.

---

## Sécurité — limites connues

Les [règles Firestore](firestore.rules) actuelles autorisent la lecture et l'écriture de
tout document à **n'importe quel utilisateur authentifié**. Le cloisonnement par rôle
(un commercial ne voit que ses contacts, seul l'admin gère l'équipe) est donc appliqué
**côté client uniquement** — sauf pour la suppression de compte, protégée par la Cloud
Function. C'est un choix assumé pour un CRM interne sans accès public ; un durcissement
des règles serait nécessaire avant une mise en production ouverte.

---

## Scripts utilitaires

`scripts/renumber-contacts.mjs` — migration ponctuelle qui renumérote les `contactId`
en 1, 2, 3… et recale le compteur. `contactId` étant purement affiché, l'opération est
sans risque de rupture de références.

```bash
node scripts/renumber-contacts.mjs <adminEmail> <adminPassword> [--dry-run]
```
