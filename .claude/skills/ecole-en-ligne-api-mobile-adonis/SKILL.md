---
name: ecole-en-ligne-api-mobile-adonis
description: Utiliser pour implémenter ou relire l'API REST d'École en ligne destinée à l'app mobile, côté AdonisJS : guard access tokens, routes versionnées, réutilisation des services et policies, sérialisation, idempotence de la saisie, limitation de débit et tests.
---

# École en ligne — API mobile côté AdonisJS

Le cahier des charges prévoyait « pas d'API REST publique en lot 1 ». L'app mobile en impose une :
c'est une **extension de périmètre assumée**, à tracer comme telle. Elle ne remplace pas Inertia,
elle vit à côté.

## Principe directeur

**L'API ne réécrit aucune règle de gestion.** Les contrôleurs d'API appellent exactement les mêmes
services (`NoteService`, `MoyenneService`, `BulletinService`…) et les mêmes policies Bouncer que
les contrôleurs Inertia. Une règle dupliquée est une règle qui divergera : le jour où le calcul de
moyenne change, le mobile afficherait autre chose que le bulletin.

Si une vérification manque côté API, c'est qu'elle était dans un contrôleur web au lieu d'un
service — la corriger là, pas la recopier ici.

## Authentification par jeton

Guard `access_tokens`, en plus du guard de session utilisé par le web.

```ts
// app/models/user.ts
static accessTokens = DbAccessTokensProvider.forModel(User, {
  expiresIn: '30 days',
  prefix: 'eel_',
})
```

```ts
// config/auth.ts
guards: {
  web: sessionGuard({ /* ... */ }),
  api: tokensGuard({
    provider: tokensUserProvider({ tokens: 'accessTokens', model: () => import('#models/user') }),
  }),
}
```

- Migration `auth_access_tokens` (`node ace make:migration auth_access_tokens`) : `tokenable_id`,
  `hash`, `abilities`, `last_used_at`, `expires_at`.
- Création : `User.accessTokens.create(user, ['*'], { expiresIn: '30 days' })`. La valeur n'est
  lisible qu'une fois, via `token.value!.release()` — elle n'est jamais relue ni renvoyée ensuite.
- Routes protégées par `middleware.auth({ guards: ['api'] })`.
- **Restreindre les abilities au profil** : un jeton d'enseignant ne porte pas `'*'` mais les
  capacités de son rôle. Un jeton de tuteur est en lecture seule.
- Les rôles administrateur, direction et secrétariat **ne reçoivent pas de jeton mobile** : refuser
  la connexion API pour ces rôles. Moins de surface, et conforme au périmètre mobile.
- Révocation à la déconnexion, et révocation de tous les jetons d'un compte au changement de mot de
  passe ou de rôle.

## Routes

Préfixe `/api/v1`, versionné dès le premier jour : une app installée sur un téléphone ne se met pas
à jour en même temps que le serveur, et une version ancienne doit continuer à fonctionner.

| Méthode | Route | Rôle |
| --- | --- | --- |
| POST | `/api/v1/connexion` | tous (profils mobiles) |
| POST | `/api/v1/deconnexion` | authentifié |
| GET | `/api/v1/moi` | authentifié |
| GET | `/api/v1/mes-classes` | enseignant |
| GET | `/api/v1/evaluations` | enseignant |
| POST | `/api/v1/evaluations` | enseignant |
| GET | `/api/v1/evaluations/:id/grille` | enseignant |
| PATCH | `/api/v1/evaluations/:id/notes` | enseignant |
| POST | `/api/v1/evaluations/:id/soumettre` | enseignant |
| PUT | `/api/v1/appreciations/:id` | enseignant |
| GET | `/api/v1/enfants` | tuteur |
| GET | `/api/v1/eleves/:id/notes-publiees` | tuteur, élève |
| GET | `/api/v1/eleves/:id/bulletins` | tuteur, élève |
| GET | `/api/v1/bulletins/:id/pdf` | tuteur, élève |

La route `notes-publiees` ne renvoie **que** ce qui est publié (RG18). Le filtre est dans le
service et dans la policy, pas dans le sérialiseur : un filtre d'affichage s'oublie.

## Saisie des notes — lot et idempotence

`PATCH /api/v1/evaluations/:id/notes` accepte un **lot** d'opérations, chacune portant sa clé
d'idempotence :

```json
{ "operations": [
  { "cle": "uuid", "eleveId": "...", "valeur": 14.5, "absent": false, "observation": null }
]}
```

- Une clé déjà traitée renvoie le même résultat sans réécrire : le mobile renvoie après coupure,
  et un doublon ne doit ni dédoubler ni écraser.
- Le lot entier dans **une transaction** : pas de demi-saisie.
- Réponse **par opération** : acceptée, ou refusée avec son motif (évaluation validée RG12, fenêtre
  de saisie fermée RG13, valeur hors bornes RG10, élève hors de la classe). Jamais un 400 global
  qui laisserait l'app deviner laquelle a échoué.
- `absent` et `valeur` sont exclusifs : les confondre casse RG11 côté moyenne.
- Le journal (RG22) est alimenté dans la même transaction, avec la mention de l'origine mobile.

## Sérialisation

- Un sérialiseur explicite par ressource. **Jamais `model.toJSON()` brut** : il expose les colonnes
  ajoutées plus tard sans que personne ne le remarque.
- Aucun champ non nécessaire au mobile : pas de hash de mot de passe évidemment, mais pas non plus
  d'adresse de tuteur, de numéro d'acte de naissance ni de pièce jointe dans une liste de classe.
- Les moyennes sont envoyées **non arrondies**, l'arrondi reste à l'affichage (RG15). Le mobile ne
  recalcule jamais une moyenne ni un rang : il affiche ce que le serveur a calculé (RG14).
- Pagination sur toute collection, avec curseur ou page, et une limite maximale imposée côté
  serveur.

## Sécurité propre à l'API

- **Les policies Bouncer s'appliquent identiquement.** Un contrôleur d'API qui ne fait pas
  `bouncer.authorize` est un trou : une API est plus facile à sonder qu'une interface web.
- `EvaluationPolicy` part de l'affectation (enseignant + classe + matière + année active, RG9),
  jamais d'un identifiant de classe fourni par le client.
- `BulletinPolicy` vérifie la publication **et** le rattachement tuteur avant toute lecture
  (RG18, RG20).
- **Limitation de débit** sur la connexion (verrouillage après 5 échecs, comme le web) et sur les
  routes de lecture en masse.
- Les PDF passent par une route authentifiée qui vérifie les droits à chaque appel ; pas d'URL
  signée à longue durée qui survivrait à une révocation de jeton.
- Messages d'erreur sobres : jamais de nom de table, de requête ni de trace, même en 500.
- CORS inutile pour une app native : ne pas ouvrir l'API aux origines web par confort.

## Tests Japa

- Chaque route a un test de succès **et** un test de refus par rôle non autorisé.
- Un test vérifie qu'un jeton de tuteur ne peut lire aucun bulletin non publié (RG18).
- Un test vérifie qu'un jeton d'enseignant ne peut rien écrire hors de ses affectations (RG9).
- Un test rejoue deux fois le même lot avec les mêmes clés et vérifie l'absence de doublon.
- Un test vérifie qu'un compte direction ou administrateur ne peut pas obtenir de jeton mobile.
- Un test compare la moyenne renvoyée par l'API et celle du bulletin généré : même service, même
  valeur.
