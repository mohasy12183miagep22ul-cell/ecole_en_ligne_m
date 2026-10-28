# École en ligne — application mobile

Application Expo (SDK 58, Expo Router) compagnon de l'application web École en ligne. Elle consomme
l'API mobile du serveur AdonisJS (`/api/v1`), décrite dans [docs/api.md](docs/api.md). L'interface
reprend le prototype web ([docs/prototype](docs/prototype)) adapté au téléphone.

## Démarrer

```bash
npm install
cp .env.example .env      # puis renseigner EXPO_PUBLIC_API_URL
npx expo start
```

Sur un téléphone ou un émulateur Android, `EXPO_PUBLIC_API_URL` doit être l'adresse IP du poste sur
le réseau local (serveur lancé avec `HOST=0.0.0.0`), jamais `localhost`. Rechargez complètement
l'application après une modification du `.env`.

En développement, l'écran de connexion propose les comptes de démonstration du seeder serveur.

## Espaces

Le profil reçu à la connexion (`utilisateur.espaces`) décide de l'espace ouvert. Chaque espace est
gardé par `Stack.Protected` dans [src/app/_layout.tsx](src/app/_layout.tsx), liens profonds compris.

| Espace | Accent | Écrans |
| --- | --- | --- |
| Enseignant | bleu | Mes classes, Évaluations, grille de saisie, nouvelle évaluation, Appréciations, Récap |
| Direction | violet | Validation (valider, renvoyer, déverrouiller), Suivi des saisies et dérogations, Inscriptions |
| Famille | vert | Accueil, Notes, Bulletins, Dossier (lecture seule) |

Un compte sans espace mobile (administrateur, secrétariat) est renvoyé vers le web. Un compte dont le
mot de passe est imposé ouvre directement l'écran de changement.

Côté famille, rien d'autre que le publié n'apparaît (RG18) : le serveur n'expose pas encore les notes
ni les bulletins, les écrans l'indiquent.

## Organisation

```
src/
  api/          client typé de l'API (une fonction par point d'accès)
  app/          routes Expo Router : (auth), enseignant, direction, famille, profil
  composants/   composants partagés (Carte, Bouton, Champ, Feuille, Pastille…)
  enseignant/   grille de saisie, sélecteurs d'affectation et de période
  famille/      sélection de l'enfant
  requetes/     clés TanStack Query
  saisie/       file des notes hors ligne, état du réseau
  session/      session, jeton, aiguillage
  theme/        jetons de design (source unique des couleurs et tailles)
  utils/        formats (nombres, dates, initiales)
```

## Saisie hors ligne

Chaque note saisie est écrite immédiatement sur l'appareil (SQLite, `expo-sqlite/kv-store`), puis
envoyée par lots dès que le réseau le permet ; elle survit à la fermeture de l'application. Une
saisie refusée par le serveur (RG12, RG13) reste sur l'appareil jusqu'à ce que l'enseignant décide de
l'abandonner. La déconnexion efface tout : jeton, cache et file d'attente. Sur le web, la file ne
vit qu'en mémoire.

## Vérifier

```bash
npm run typecheck
npm run lint
```
