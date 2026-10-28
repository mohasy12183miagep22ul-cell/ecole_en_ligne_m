# API mobile — École en ligne

Référence de l'API JSON que l'application React Native consomme. Le serveur est le projet AdonisJS
`ecole-en-ligne` : l'API y vit sous `/api/v1` (routes dans `start/routes_api.ts`, contrôleurs dans
`app/controllers/api/`). Elle passe par **les mêmes services, policies et règles de gestion que le
web** : seule la forme des réponses change.

Côté application, chaque point d'accès a sa fonction typée dans [`src/api/`](../src/api/) :

| Fichier | Contenu |
| --- | --- |
| `client.ts` | `api()`, `ApiError`, `API_URL`, `quandSessionPerdue()` |
| `jeton.ts` | stockage du jeton (SecureStore ; mémoire sur le web) |
| `auth.ts` | connexion, second facteur, déconnexion, profil, mot de passe |
| `enseignant.ts` | affectations, évaluations, grille de notes, appréciations |
| `direction.ts` | validation des évaluations, suivi, dérogations, inscriptions |
| `portail.ts` | enfants rattachés et dossier (famille) |
| `types.ts` | tous les types de requêtes et de réponses |

```ts
import { connexion, mesAffectations, ApiError } from '@/api';
```

---

## 1. Généralités

### Adresse du serveur

Fixée par `EXPO_PUBLIC_API_URL` dans `.env` (voir `.env.example`), sans `/api/v1` à la fin.

- **Par défaut : le serveur en ligne, `https://ecoleenligne.vercel.app`** (Vercel, projet
  `ecole_en_ligne`, redéployé à chaque push sur `main` du dépôt serveur).
- Pour viser un serveur local, surchargez la variable dans `.env.local` (non versionné) :
- Simulateur iOS / navigateur : `http://localhost:3333`
- Téléphone ou émulateur Android : l'adresse IP du poste sur le réseau local, ex.
  `http://192.168.1.20:3333`, et le serveur lancé avec `HOST=0.0.0.0` dans son `.env`.
- Production : l'adresse HTTPS de l'établissement. HTTP en clair n'est acceptable qu'en
  développement.

Après une modification du `.env`, rechargez complètement l'application.

### Format

- Requêtes et réponses en JSON (`Content-Type: application/json`). Le serveur répond en JSON quel
  que soit l'en-tête `Accept`, erreurs comprises.
- Dates au format ISO `AAAA-MM-JJ`, horodatages ISO 8601 (`2026-10-26T14:03:00.000Z`).
- **Moyennes et statistiques jamais arrondies par le serveur (RG15).** L'application arrondit à deux
  décimales à l'affichage, et seulement là.
- Listes paginées : paramètre `page` (à partir de 1), 25 éléments par page, réponse
  `pagination: { page, dernierePage, total }`.
- Pas de cookie, pas de jeton CSRF : l'API n'accepte que le jeton porté par l'en-tête
  `Authorization`.

### Authentification

```
Authorization: Bearer eel_xxxxxxxx…
```

Le jeton est remis une seule fois, à la connexion, et le serveur n'en garde que l'empreinte. Il
**expire au bout de 30 jours**. L'application le garde dans le trousseau iOS ou le Keystore Android
(`expo-secure-store`, accès `WHEN_UNLOCKED_THIS_DEVICE_ONLY`) et ne le met jamais dans un journal
ni dans l'état React persistant.

Toute réponse `401` à un appel authentifié efface le jeton local et déclenche le rappel enregistré
avec `quandSessionPerdue()`. L'application renvoie alors vers l'écran de connexion. Un 401 survient
quand le jeton est expiré, révoqué (déconnexion) ou que le compte a été désactivé.

### Espaces et rôles

Le profil (`utilisateur.espaces`) indique les espaces que l'application doit proposer, par ordre de
priorité :

| Espace | Rôles | Préfixe |
| --- | --- | --- |
| `direction` | direction | `/api/v1/direction` |
| `enseignant` | enseignant, professeur principal | `/api/v1/enseignant` |
| `portail` | tuteur | `/api/v1/portail` |

Un compte peut cumuler plusieurs rôles, donc plusieurs espaces. Un compte sans espace mobile
(administrateur, secrétariat seuls) se connecte mais doit être renvoyé vers le web. Le compte
`eleve` n'a pas encore d'espace mobile : aucun lien n'existe en base entre un compte élève et sa
fiche.

Le serveur vérifie toujours les droits : l'espace (rôle), puis la ressource (policy). Masquer un
bouton dans l'application est du confort, pas une protection.

### Erreurs

| Statut | Quand | Corps |
| --- | --- | --- |
| `401` | Pas de jeton, jeton invalide ou expiré, identifiants faux, code faux | `{ code?, message }` ou `{ errors: [{ message }] }` |
| `403` | Rôle non admis, mot de passe à changer, ressource refusée par une policy | `{ code?, message }` |
| `404` | Ressource inexistante ou non accessible (portail), adresse inconnue | `{ code?, message }` |
| `422` | Saisie invalide | `{ errors: [{ field, message, rule }] }` |
| `422` | Refus par une règle de gestion | `{ message, regle }`, ex. `regle: "RG12"` |
| `423` | Compte verrouillé après 5 échecs | `{ code: "E_COMPTE_VERROUILLE", message, jusqua }` |

Codes applicatifs (`code`) : `E_IDENTIFIANTS`, `E_COMPTE_VERROUILLE`, `E_COMPTE_DESACTIVE`,
`E_CODE_INCORRECT`, `E_DEFI_EXPIRE`, `E_MOT_DE_PASSE_A_CHANGER`, `E_ROLE`, `E_INTROUVABLE`,
`E_ROUTE_INTROUVABLE`. Le client y ajoute `E_RESEAU` (statut 0) quand le serveur est injoignable
ou ne répond pas dans les 15 secondes.

Côté application, tout passe par `ApiError` :

```ts
try {
  await enregistrerNotes(evaluationId, saisies);
} catch (e) {
  if (e instanceof ApiError) {
    if (e.horsLigne) garderEnAttente(saisies);     // réseau coupé : on réessaiera
    else if (e.regle) afficherBandeau(e.message);  // RG10, RG12, RG13…
    else if (e.champ('saisies')) afficherSous('saisies', e.champ('saisies'));
  }
}
```

Le texte de `message` est en français et peut s'afficher tel quel.

---

## 2. Authentification et compte

### `POST /auth/connexion` — `connexion(email, password, appareil?)`

```json
{ "email": "a.bah@ecole.gn", "password": "…", "appareil": "iPhone de Mariama" }
```

`appareil` (120 caractères au plus, facultatif) nomme le jeton.

**200 : connecté**

```json
{
  "statut": "connecte",
  "jeton": { "type": "bearer", "jeton": "eel_…", "expireLe": "2026-11-25T10:00:00.000Z" },
  "utilisateur": {
    "id": 12, "fullName": "Aïssatou Bah", "email": "a.bah@ecole.gn", "initials": "AB",
    "sousTitre": "Professeure de mathématiques",
    "roles": ["enseignant", "professeur_principal"], "espaces": ["enseignant"],
    "doitChangerMotDePasse": false
  }
}
```

**200 : second facteur requis.** Seuls les comptes direction et administrateur y passent.

```json
{ "statut": "double_facteur", "defi": "0b6c…-uuid", "email": "dir@ecole.gn", "codeDeveloppement": null }
```

Un code à 6 chiffres part par courriel. Il reste valable 10 minutes et accepte 5 essais.
`codeDeveloppement` n'est rempli qu'en développement, quand aucun courriel ne part.

Erreurs : `401 E_IDENTIFIANTS`, `423 E_COMPTE_VERROUILLE` (15 minutes après 5 échecs consécutifs).
Le serveur renvoie le même message que le compte existe ou non. Chaque échec est journalisé.

`connexion()` enregistre le jeton automatiquement quand `statut === 'connecte'`.

### `POST /auth/verification` — `verifierCode(defi, code, appareil?)`

```json
{ "defi": "0b6c…", "code": "482913" }
```

Réussite : même réponse que la connexion (`statut: "connecte"`). Un défi ne sert qu'une fois.

Erreurs : `401 E_CODE_INCORRECT` (le défi reste ouvert : rester sur l'écran du code),
`401 E_DEFI_EXPIRE` (expiré, consommé ou 5 essais : retour à la connexion).

### `POST /auth/verification/renvoyer` — `renvoyerCode(defi)`

Génère un nouveau code pour le même défi : l'ancien devient invalide et les essais repartent à zéro.
La réponse est un nouveau `double_facteur`. Erreur : `401 E_DEFI_EXPIRE`.

### `POST /auth/mot-de-passe-oublie` — `motDePasseOublie(email)`

**202**, même réponse que le compte existe ou non :

```json
{ "message": "Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.", "lienDeveloppement": null }
```

Le lien (valable 30 minutes) mène à la page web de réinitialisation : l'application ne choisit pas
le nouveau mot de passe elle-même.

### `POST /auth/deconnexion` — `deconnexion()`

**204.** Révoque le jeton courant. Il n'est pas effacé de la base (RG21) : son expiration est
ramenée à l'instant présent. `deconnexion()` efface le jeton local même si l'appel échoue.

### `GET /moi` — `moi()`

```json
{ "utilisateur": { … }, "anneeActive": { "id": 3, "libelle": "2026-2027", "dateDebut": "2026-10-01", "dateFin": "2027-07-15" } }
```

`anneeActive` vaut `null` entre la clôture d'une année et l'activation de la suivante. Dans ce cas,
les listes des espaces sont vides.

### `PUT /moi/mot-de-passe` — `changerMotDePasse(actuel, nouveau, confirmation)`

```json
{ "actuel": "…", "nouveau": "…", "confirmation": "…" }
```

Nouveau mot de passe : 10 à 128 caractères, différent de l'actuel. Réponse :
`{ "utilisateur": { … } }`. Erreur `422` avec `errors[].field` à `actuel` ou `nouveau`.

### Mot de passe imposé

Un compte créé par l'administrateur doit changer son mot de passe à la première connexion
(`utilisateur.doitChangerMotDePasse: true`). Tant que ce n'est pas fait, seuls `GET /moi`,
`PUT /moi/mot-de-passe` et `POST /auth/deconnexion` répondent. Tout le reste renvoie
`403 E_MOT_DE_PASSE_A_CHANGER`. L'application ouvre donc directement l'écran de changement.

---

## 3. Espace enseignant (`/enseignant`)

Rôles : enseignant ou professeur principal. **Tout part des affectations** (classe + matière) de
l'enseignant sur l'année active (RG9). Une évaluation ou une affectation d'un collègue renvoie
`403`, quel que soit l'identifiant tenté.

### `GET /enseignant/affectations` — `mesAffectations()`

Écran « Mes classes » : une carte par affectation.

```json
{
  "annee": { "id": 3, "libelle": "2026-2027", … },
  "periode": { "id": 7, "libelle": "1er trimestre", "debutSaisie": "2026-10-01", "finSaisie": "2026-12-20" },
  "affectations": [{
    "id": 41, "classe": "3e A", "niveau": "3e", "matiere": "Mathématiques", "noteMaxDefaut": 20,
    "effectif": 38, "evaluations": 4, "professeurPrincipal": true,
    "saisie": { "ouverte": true, "jusquAu": "2026-12-20", "derogation": false },
    "enCours": { "id": 310, "titre": "Devoir n°2", "faits": 21, "effectif": 38 }
  }]
}
```

`periode` est la période dont la fenêtre de saisie contient aujourd'hui, sinon la dernière
commencée. `enCours` est la dernière évaluation en brouillon.

### `GET /enseignant/affectations/:id/periodes` — `periodesDe(affectationId)`

Périodes de l'année, avec l'état de la saisie pour cette affectation (RG13) :

```json
{ "periodes": [{ "id": 7, "libelle": "1er trimestre", "debutSaisie": "…", "finSaisie": "…", "courante": true,
  "saisie": { "ouverte": false, "jusquAu": null, "derogation": false, "raison": "close" } }] }
```

`saisie.derogation: true` signale une fenêtre prolongée par la direction jusqu'à `jusquAu`.

### `GET /enseignant/types-evaluation` — `typesEvaluation()`

`{ "types": [{ "cle": "devoir", "libelle": "Devoir" }, …] }`. Clés possibles : `interrogation`,
`devoir`, `composition`, `tp`, `oral`.

### `GET /enseignant/evaluations?affectation=&page=` — `mesEvaluations({ affectation, page })`

Évaluations de l'enseignant (ou d'une affectation), les plus récentes d'abord, avec leurs
statistiques de saisie. Réponse : `{ evaluations: EvaluationListe[], pagination }`.

### `POST /enseignant/evaluations` — `creerEvaluation(donnees)`

```json
{ "affectationId": 41, "periodeId": 7, "type": "devoir", "titre": "Devoir n°3",
  "date": "2026-11-04", "noteMax": 20, "poids": 2 }
```

Titre de 3 à 120 caractères, `noteMax` de 1 à 100, `poids` strictement positif (100 au plus).
**201** : `{ "evaluation": Evaluation }`. Refus `422` si l'année n'est pas active (RG1, RG2) ou si la
fenêtre de saisie de la période est close (RG13).

### `GET /enseignant/evaluations/:id` — `grille(evaluationId)`

La grille de saisie :

```json
{
  "evaluation": { "id": 310, "titre": "Devoir n°2", "etat": "brouillon", "noteMax": 20, "poids": 1, … },
  "saisie": { "ouverte": true, "jusquAu": "2026-12-20", "derogation": false },
  "lignes": [{ "id": 1001, "matricule": "2024-00012", "nom": "BAH", "prenoms": "Fatoumata",
               "valeur": 14.5, "absent": false, "observation": "" }],
  "statistiques": { "moyenne": 11.2, "min": 4, "max": 18, "notes": 21, "absents": 1, "reste": 16, "effectif": 38 }
}
```

Élèves dans l'ordre alphabétique : ceux de la classe à la date de l'évaluation (inscription
validée, non sortis). Les statistiques restent dans le barème de l'évaluation.

### `PUT /enseignant/evaluations/:id` — `modifierEvaluation(id, donnees)`

Mêmes champs que la création, sans `affectationId` ni `periodeId`. Uniquement en brouillon (RG12).

### `POST /enseignant/evaluations/:id/notes` — `enregistrerNotes(id, saisies)`

Enregistrement automatique de la grille : un lot de 1 à 200 saisies.

```json
{ "saisies": [
  { "eleveId": 1001, "valeur": 14.5, "absent": false },
  { "eleveId": 1002, "valeur": null, "absent": true },
  { "eleveId": 1003, "valeur": 0, "absent": false, "observation": "Copie blanche" }
] }
```

Réponse : `{ "modifiees": 3, "enregistreLe": "…", "statistiques": { … } }`.

Règles appliquées par le serveur :

- **Tout ou rien** : une seule saisie refusée fait rejeter tout le lot.
- **RG11** : un absent n'a pas de note (`absent: true` avec `valeur` non nulle est refusé). Un `0`
  est une vraie note et compte dans la moyenne : ne jamais transformer un champ vide en 0.
- **RG10** : la note doit être comprise entre 0 et `noteMax` (refus `422`, `regle: "RG10"`).
  Contrôlez-la aussi à la frappe pour signaler l'erreur avant l'envoi.
- **RG12** : évaluation soumise ou validée, saisie fermée (`regle: "RG12"`).
- **RG13** : hors fenêtre de saisie sans dérogation (`regle: "RG13"`).
- Une saisie identique à la valeur enregistrée est ignorée. On peut donc renvoyer sans risque, au
  retour du réseau, toute la file des saisies en attente.
- Chaque note créée ou modifiée est journalisée côté serveur (RG22).

Hors ligne : gardez les saisies en attente par `eleveId` (la dernière l'emporte), puis renvoyez-les
en un lot au retour du réseau. Un `ApiError` avec `horsLigne: true` signifie que rien n'a été
enregistré.

### `POST /enseignant/evaluations/:id/soumettre` — `soumettreEvaluation(id)`

Envoie l'évaluation à la direction : `etat` passe à `soumise` et la saisie se ferme.

### `GET /enseignant/appreciations?affectation=&periode=` — `appreciations(affectation, periode?)`

Sans `periode`, la période courante est utilisée.
`{ "periode": { "id", "libelle" }, "eleves": [{ "id", "nom", "prenoms", "texte", "moyenne" }] }`.
`moyenne` est la moyenne provisoire de la matière sur 20 (évaluations non validées comprises).

### `PUT /enseignant/appreciations` — `enregistrerAppreciation(donnees)`

```json
{ "affectationId": 41, "periodeId": 7, "eleveId": 1001, "texte": "Bon trimestre, travail régulier." }
```

250 caractères au plus ; un texte vide efface l'appréciation. Réponse : `{ "enregistreLe": "…" }`.

### `GET /enseignant/recapitulatif?affectation=&periode=` — `recapitulatif(affectation, periode?)`

Synthèse de la matière dans la classe (moyenne, min, max, taux de réussite entre 0 et 1) et
classement des élèves, avec un rang identique en cas d'égalité et le rang suivant sauté (RG16).

---

## 4. Espace direction (`/direction`)

Rôle : direction. Toutes les actions sont journalisées côté serveur (RG22).

### `GET /direction/evaluations?etat=soumise|validee&page=` — `evaluationsDirection({ etat, page })`

`etat` vaut `soumise` par défaut (onglet « À valider »).
Réponse : `{ compteurs: { aValider, validees }, evaluations: EvaluationListe[], pagination }`.

### `GET /direction/evaluations/:id` — `detailEvaluation(id)`

Évaluation en lecture, avec l'enseignant, les notes de la classe et les statistiques.

### `POST /direction/evaluations/:id/valider` — `validerEvaluation(id)`

L'évaluation soumise passe à `validee` (RG12). Réponse : `{ "evaluation": { "id", "titre", "etat" } }`.

### `POST /direction/evaluations/:id/renvoyer` — `renvoyerEvaluation(id, motif)`

Renvoie l'évaluation à l'enseignant : retour au brouillon, motif de 5 à 250 caractères, visible par
l'enseignant dans `motifRetour`.

### `POST /direction/evaluations/:id/deverrouiller` — `deverrouillerEvaluation(id, motif)`

Une évaluation validée repasse au brouillon. C'est une action du chef d'établissement, avec motif
obligatoire (RG12).

### `GET /direction/suivi?periode=&classe=` — `suiviSaisies({ periode, classe })`

Une ligne par affectation de l'année, avec le nombre d'évaluations de la période en brouillon,
soumises et validées, et la dérogation en cours (`derogationJusquAu`). La réponse inclut aussi les
listes `periodes` et `classes` pour les filtres.

### `POST /direction/derogations` — `accorderDerogation(donnees)`

```json
{ "affectationId": 41, "periodeId": 7, "jusquAu": "2026-12-27", "motif": "Enseignant en congé maladie" }
```

Rouvre la saisie de cette affectation jusqu'à la date donnée (RG13). **201** : `{ "jusquAu": "…" }`.

### `GET /direction/inscriptions?page=` — `inscriptionsAValider(page)`

Dossiers soumis à valider, avec `manquantes` (pièces obligatoires absentes, RG6), et liste des
classes avec effectif et capacité (RG7).

### `POST /direction/inscriptions/:id/valider` — `validerInscription(id, donnees)`

```json
{ "classeId": 9, "forcer": false }
```

Refus `422` si une pièce obligatoire manque (RG6), si la classe est pleine (RG7), ou si l'élève a
déjà une inscription validée cette année (RG5) ou est sorti sans réactivation (RG8). Pour dépasser
la capacité : `forcer: true` et `motifDepassement`.

### `POST /direction/inscriptions/:id/refuser` — `refuserInscription(id, motif)`

---

## 5. Portail famille (`/portail`)

Rôle : tuteur. **Lecture seule, limitée aux élèves rattachés au compte (RG20).**

Les élèves y sont désignés par un **identifiant opaque** (chaîne chiffrée), jamais par leur
identifiant interne : à repasser tel quel, sans l'interpréter ni le stocker durablement. Un
identifiant forgé et un élève non rattaché reçoivent la même réponse, `404 E_INTROUVABLE`.

### `GET /portail/enfants` — `mesEnfants()`

```json
{ "enfants": [{ "id": "…opaque…", "matricule": "2024-00012", "nom": "BAH", "prenoms": "Fatoumata",
                "sexe": "F", "classe": "3e A", "niveau": "3e" }] }
```

`classe` et `niveau` valent `null` sans inscription validée sur l'année active.

### `GET /portail/enfants/:id` — `dossierEnfant(id)`

Identité, statut, scolarité de l'année active et tuteurs (nom, lien de parenté, principal). Le
dossier ne contient ni téléphone, ni pièce jointe, ni journal.

### Notes et bulletins : pas encore exposés

**Un bulletin et ses notes ne sont visibles par la famille qu'après publication par la direction
(RG18).** Le circuit de publication des bulletins n'est pas encore livré côté serveur. Aucune note
n'est donc exposée au portail, même validée. Les points d'accès `GET /portail/enfants/:id/bulletins`
viendront avec ce lot. N'affichez rien qui laisse penser le contraire.

---

## 6. Récapitulatif des points d'accès

| Méthode | Chemin (`/api/v1…`) | Fonction | Accès |
| --- | --- | --- | --- |
| POST | `/auth/connexion` | `connexion` | public |
| POST | `/auth/verification` | `verifierCode` | public |
| POST | `/auth/verification/renvoyer` | `renvoyerCode` | public |
| POST | `/auth/mot-de-passe-oublie` | `motDePasseOublie` | public |
| POST | `/auth/deconnexion` | `deconnexion` | connecté |
| GET | `/moi` | `moi` | connecté |
| PUT | `/moi/mot-de-passe` | `changerMotDePasse` | connecté |
| GET | `/enseignant/affectations` | `mesAffectations` | enseignant |
| GET | `/enseignant/affectations/:id/periodes` | `periodesDe` | enseignant |
| GET | `/enseignant/types-evaluation` | `typesEvaluation` | enseignant |
| GET | `/enseignant/evaluations` | `mesEvaluations` | enseignant |
| POST | `/enseignant/evaluations` | `creerEvaluation` | enseignant |
| GET | `/enseignant/evaluations/:id` | `grille` | enseignant |
| PUT | `/enseignant/evaluations/:id` | `modifierEvaluation` | enseignant |
| POST | `/enseignant/evaluations/:id/notes` | `enregistrerNotes` | enseignant |
| POST | `/enseignant/evaluations/:id/soumettre` | `soumettreEvaluation` | enseignant |
| GET | `/enseignant/appreciations` | `appreciations` | enseignant |
| PUT | `/enseignant/appreciations` | `enregistrerAppreciation` | enseignant |
| GET | `/enseignant/recapitulatif` | `recapitulatif` | enseignant |
| GET | `/direction/evaluations` | `evaluationsDirection` | direction |
| GET | `/direction/evaluations/:id` | `detailEvaluation` | direction |
| POST | `/direction/evaluations/:id/valider` | `validerEvaluation` | direction |
| POST | `/direction/evaluations/:id/renvoyer` | `renvoyerEvaluation` | direction |
| POST | `/direction/evaluations/:id/deverrouiller` | `deverrouillerEvaluation` | direction |
| GET | `/direction/suivi` | `suiviSaisies` | direction |
| POST | `/direction/derogations` | `accorderDerogation` | direction |
| GET | `/direction/inscriptions` | `inscriptionsAValider` | direction |
| POST | `/direction/inscriptions/:id/valider` | `validerInscription` | direction |
| POST | `/direction/inscriptions/:id/refuser` | `refuserInscription` | direction |
| GET | `/portail/enfants` | `mesEnfants` | tuteur |
| GET | `/portail/enfants/:id` | `dossierEnfant` | tuteur |

## 7. Essayer avec curl

Les comptes de démonstration viennent du seeder du serveur (`node ace db:seed`), avec le mot de
passe `MOT_DE_PASSE_DEMO` de `database/seeders/comptes_demo_seeder.ts` : `i.sow@flamboyants.edu.gn`
(enseignant), `m.camara@flamboyants.edu.gn` (direction, second facteur), `f.diallo@mail.gn`
(tuteur).

```bash
# Connexion
curl -s -X POST http://localhost:3333/api/v1/auth/connexion \
  -H 'Content-Type: application/json' \
  -d '{"email":"i.sow@flamboyants.edu.gn","password":"…"}'

# Appel authentifié
curl -s http://localhost:3333/api/v1/enseignant/affectations \
  -H 'Authorization: Bearer eel_…'
```
# API mobile — côté serveur

API JSON consommée par l'application React Native (projet `ecole-en-ligne-rn`). La référence
complète des points d'accès, des réponses et des erreurs est dans ce projet-là :
`ecole-en-ligne-rn/docs/api.md`. Ce fichier ne décrit que l'implémentation côté serveur.

## Où est le code

| Élément | Fichier |
| --- | --- |
| Routes `/api/v1` | `start/routes_api.ts` (préchargé dans `adonisrc.ts`) |
| Santé (`GET /api/v1/sante`, alias `health`) : API et base joignables, sans jeton | `app/controllers/api/sante_controller.ts` |
| Contrôleurs | `app/controllers/api/` |
| Barrière (jeton, compte actif, mot de passe imposé, rôle) | `app/middleware/api_middleware.ts` |
| Réponses toujours en JSON | `app/middleware/force_json_middleware.ts` |
| Garde `api` (jetons d'accès) | `config/auth.ts`, `User.accessTokens` |
| Émission et révocation des jetons | `app/services/jeton_service.ts` |
| Second facteur sans session (défis) | `app/services/code_verification_service.ts`, table `defis_connexion` |
| Portail famille (RG20, identifiants opaques) | `app/services/portail_service.ts`, `ElevePolicy.consulterFamille` |
| Tests | `tests/functional/api_mobile.spec.ts` |

## Choix

- **Mêmes services, mêmes policies que le web.** Les contrôleurs API ne font que valider,
  autoriser, appeler le service et mettre en forme (dates ISO, pas de format d'affichage). Le suivi
  des saisies est passé dans `EvaluationService.suiviSaisies`, partagé par les deux contrôleurs.
- **Jetons d'accès opaques** (`eel_…`), dont seule l'empreinte est stockée, valables 30 jours. Une
  révocation (déconnexion, compte désactivé) ramène `expires_at` à l'instant présent au lieu de
  supprimer la ligne (RG21).
- **CSRF** : `/api/*` est exclu de la vérification (`config/shield.ts`), car l'API n'accepte que le
  garde `api`. Un cookie de session ne vaut rien sous `/api`.
- **Second facteur** : sans session côté mobile, le code en attente est porté par un défi (UUID).
  Seule l'empreinte du code est stockée : 10 minutes, 5 essais, usage unique, comme sur le web.
- **Portail** : les élèves sont désignés par un identifiant chiffré (`encryption`, but
  `portail_eleve`), jamais par leur identifiant séquentiel. Non rattaché ou identifiant forgé :
  même 404. Aucune note ni aucun bulletin n'est exposé avant le lot des bulletins (RG18).
- Le code web lit désormais explicitement le garde `web` (`auth.use('web')`), car `ctx.auth.user`
  peut aussi désigner un compte authentifié par jeton.

## À trancher

- Durée des jetons : 30 jours, fixe. La session web dure 8 h avec prolongation sur activité. Faut-il
  une expiration glissante, ou plus courte pour les comptes direction ?
- Pas de limitation de débit sur `/api/v1/auth/*` en dehors du verrouillage par compte (5 échecs).
- CORS : seule une version web de l'application (Expo web) en aurait besoin. Les applications
  natives n'envoient pas d'en-tête `Origin`.
