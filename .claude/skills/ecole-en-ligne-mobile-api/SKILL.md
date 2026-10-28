---
name: ecole-en-ligne-mobile-api
description: Utiliser pour implémenter ou relire la couche données de l'app mobile École en ligne : authentification par jeton, SecureStore, client d'API, TanStack Query, file de saisie hors ligne des notes, gestion des erreurs et sécurité sur l'appareil.
---

# École en ligne mobile — couche données

Tout ce qui relie l'app React Native à l'API AdonisJS. L'interface est dans
`ecole-en-ligne-mobile-ui`, le côté serveur dans `ecole-en-ligne-api-mobile-adonis`.

## Authentification

Jeton d'accès AdonisJS (`auth_access_tokens`), pas de session cookie : le mobile ne partage pas la
session web.

- Connexion → `POST /api/v1/connexion` → le serveur renvoie la valeur du jeton **une seule fois**.
- **Le jeton va dans `expo-secure-store`, jamais dans AsyncStorage ni dans un état React persisté.**
  AsyncStorage est un fichier en clair : un jeton d'enseignant qui y traîne donne accès aux notes
  de ses classes.
- Envoyé en `Authorization: Bearer <jeton>` sur chaque requête.
- Expiration côté serveur à 30 jours. Un 401 vide SecureStore, purge le cache local et renvoie à
  l'écran de connexion — sans message alarmant, juste « Session expirée, reconnectez-vous ».
- Déconnexion : appeler la route de révocation **puis** vider SecureStore et le cache. Un jeton
  seulement effacé localement reste valide sur le serveur.
- Double facteur direction/administrateur : hors périmètre mobile (ces rôles restent sur le web).

Verrou biométrique optionnel à la réouverture (`expo-local-authentication`) : utile pour un
téléphone partagé en salle des professeurs. Il ne remplace pas le jeton, il en garde l'accès.

## Client d'API

Un seul module `api/client.ts`. Aucun `fetch` dispersé dans les écrans.

- URL de base dans `app.config.ts` via `extra`, jamais en dur dans le code.
- Il ajoute le jeton, sérialise, décode, et traduit les erreurs HTTP en erreurs typées :
  `ErreurReseau`, `ErreurAuth` (401), `ErreurDroit` (403), `ErreurValidation` (422, avec les
  champs), `ErreurServeur` (5xx).
- Délai d'attente explicite (15 s) : sans lui, une requête sur réseau dégradant reste pendante et
  l'écran tourne indéfiniment.
- **Jamais de `console.log` d'une réponse contenant des données élève**, même en développement.

## État serveur : TanStack Query

- Une clé de requête par ressource et par portée : `['evaluations', affectationId]`,
  `['grille', evaluationId]`, `['bulletins', eleveId]`.
- `staleTime` court sur les notes en cours de saisie, long sur les bulletins publiés (immuables,
  RG19 — un bulletin publié ne change jamais, inutile de le rafraîchir).
- Persistance du cache sur l'appareil pour que l'app s'ouvre pleine hors ligne.
- **Le cache persisté est purgé à la déconnexion**, sans exception : il contient des noms d'élèves,
  des notes et des bulletins.
- Ne jamais mettre en cache une donnée non publiée côté famille (RG18) : si le serveur ne l'envoie
  pas, l'app ne la reconstruit pas et ne la devine pas.

## Saisie hors ligne des notes — le cœur du sujet

L'enseignant saisit en salle, souvent sans réseau. La perte d'une saisie est l'échec le plus coûteux
de l'app.

**File d'attente locale durable**, pas un simple état React :

1. Chaque modification de note produit une opération `{ idempotenceKey, evaluationId, eleveId,
   valeur | absent, observation, saisieLe }`, écrite immédiatement dans un stockage durable
   (SQLite ou MMKV).
2. L'interface affiche la valeur locale tout de suite et l'état « en attente ».
3. Un travailleur vide la file dès que le réseau revient (`expo-network` / `NetInfo`), dans l'ordre,
   avec reprise exponentielle.
4. **`idempotenceKey` sur chaque opération** : un renvoi après coupure ne doit jamais créer de
   doublon ni écraser une correction plus récente.
5. Succès → l'opération sort de la file et l'état passe à « enregistré ».

Règles de conflit, à trancher explicitement :

- **Si l'évaluation a été validée pendant la coupure, le serveur refuse (RG12).** L'app ne force
  rien : elle garde la saisie, l'affiche comme rejetée avec le motif, et propose de la copier.
  Jamais d'écrasement silencieux d'une note validée.
- Si la fenêtre de saisie de la période s'est fermée (RG13), même traitement.
- La dernière saisie de l'enseignant gagne sur ses propres saisies précédentes, jamais sur une
  décision du serveur.

**La file survit à la fermeture de l'app et au redémarrage du téléphone.** C'est le test qui
compte : tuer l'app en plein vol, la rouvrir, retrouver ses notes.

## Erreurs, côté utilisateur

| Cas | Ce que voit l'utilisateur |
| --- | --- |
| Réseau coupé | Bandeau persistant + nombre de modifications en attente. Pas de boîte de dialogue. |
| 401 | Retour à la connexion, « Session expirée ». |
| 403 | « Vous n'avez pas accès à cet élément. » Sans détail technique. |
| 422 | Message rattaché au champ concerné. |
| 5xx | « Le serveur est indisponible, votre saisie est conservée. » |

Un message d'erreur ne cite jamais une table, une route ni une trace.

## Sécurité sur l'appareil

- Jeton en SecureStore uniquement.
- Purge complète à la déconnexion : jeton, cache de requêtes, file en attente, PDF téléchargés.
- PDF de bulletin stockés dans le répertoire privé de l'app, jamais dans la galerie ni un dossier
  partagé.
- HTTPS obligatoire, aucune exception de transport en clair dans la configuration Expo, y compris
  en développement sur appareil réel.
- Aucun identifiant, aucune URL de serveur de production, aucune clé dans le dépôt : tout par
  variables d'environnement Expo.
- Journalisation d'erreurs tierce éventuelle : **jamais de nom d'élève, de note ou de matricule**
  dans le rapport. Identifiants techniques seulement.

## Réseau de développement

`localhost` ne désigne pas la machine de développement depuis un téléphone ni depuis un émulateur
Android. Utiliser l'IP du réseau local servie par Expo, et prévoir la variable dès le départ :
c'est la première chose qui bloque une équipe sur un projet mobile.

## Tests

- La file hors ligne est testée en priorité : coupure en pleine saisie, redémarrage de l'app,
  retour du réseau, renvoi en double, évaluation validée entre-temps.
- Un test vérifie qu'aucune donnée non publiée n'est atteignable côté famille, cache compris (RG18).
- Un test vérifie que la déconnexion ne laisse rien sur l'appareil.
