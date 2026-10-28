---
name: ecole-en-ligne-mobile-ui
description: Utiliser pour implémenter ou relire l'interface de l'app mobile École en ligne en React Native (Expo) : jetons de design du prototype portés en RN, navigation Expo Router, écrans enseignant et famille, grille de saisie tactile, composants, accessibilité.
---

# École en ligne mobile — interface React Native

App mobile compagnon de l'application web. La couche données est dans
`ecole-en-ligne-mobile-api`, les règles métier dans `ecole-en-ligne-business-rules`.

## Périmètre

Deux profils seulement : **enseignant** et **famille** (élève ou tuteur). Ce sont les deux usages
réellement mobiles — l'enseignant saisit ses notes en salle, le tuteur consulte depuis son
téléphone. L'administration, le secrétariat et la direction restent sur le web : paramétrage,
inscriptions et délibération demandent un grand écran et ne gagnent rien à être portés.

Si une demande arrive pour un écran d'administration sur mobile, le dire plutôt que de l'ajouter :
c'est un changement de périmètre, pas un écran de plus.

## Stack

- Expo SDK 56, React Native 0.85, React 19.2, TypeScript (vérifier les versions au démarrage,
  elles bougent vite)
- **Expo Router** pour la navigation (fichiers = routes)
- **expo-secure-store** pour le jeton (jamais AsyncStorage)
- `@fortawesome/react-native-fontawesome` + `react-native-svg` pour les icônes
- Styles : un module de jetons unique, voir ci-dessous

## Jetons de design

Mêmes valeurs que le web, portées dans `theme/tokens.ts`. **Source unique** : aucune couleur, aucune
taille écrite en dur dans un écran ou un composant. Si NativeWind est ajouté, sa config lit ce
même fichier — on ne duplique jamais la palette.

```ts
export const couleurs = {
  accent: '#7424E0',
  accentDoux: '#F3ECFD',
  texte: '#1B1726',
  texteFort: '#3B3747',
  texteSecondaire: '#5E5A6B',
  texteTertiaire: '#77738A',
  fondPage: '#F6F5FA',
  fondCarte: '#FFFFFF',
  fondChamp: '#F7F6FA',
  fondEntete: '#F8F7FB',
  bordureCarte: '#ECEAF2',
  bordureChamp: '#E6E3EE',
  separateur: '#F1F0F5',
  succesTexte: '#14663F',  succesFond: '#E2F4EA',
  attentionTexte: '#7A4A00', attentionFond: '#FFF3DD',
  erreurTexte: '#A3214F',  erreurFond: '#FCE8EF',
  infoTexte: '#2448B5',    infoFond: '#EAF0FD',
}
```

Typographie : Plus Jakarta Sans chargée via `expo-font`, graisses 400/500/600/700/800. Tailles
11 / 12 / 13 / 14 / 15 / 17 / 20 / 26. Rayons 10 / 12 / 16, pastilles 999.

**Adaptations obligatoires au mobile** — le web n'est pas transposable tel quel :

- Toute cible tactile fait **44 pt minimum**. Les boutons de 28–32 px du prototype web (absent,
  observation) passent à 44 pt de zone touchable, même si le visuel reste petit (`hitSlop`).
- Les champs passent de 48 à **52 pt** de hauteur.
- Respecter les zones sûres (`useSafeAreaInsets`) en haut et en bas, encoche et barre gestuelle
  comprises.
- Pas d'effet de survol : l'état pressé remplace le hover (`Pressable` + opacité ou fond accent
  doux).

## Navigation

Expo Router, un groupe par profil, le profil décidé par le rôle reçu à la connexion :

```
app/
  (auth)/connexion.tsx, double-facteur.tsx, mot-de-passe-oublie.tsx
  (enseignant)/_layout.tsx        onglets bas
    classes.tsx, evaluations.tsx, evaluation/[id].tsx (grille), appreciations.tsx, recap.tsx
  (famille)/_layout.tsx           onglets bas
    accueil.tsx, notes.tsx, bulletins.tsx, bulletin/[id].tsx, dossier.tsx
  profil.tsx
```

Barre d'onglets basse : icône 18 pt + libellé 11 pt, actif en accent. Entête de 60 pt avec bouton
retour contextuel. Bouton flottant 56 pt en bas à droite pour l'action principale (nouvelle
évaluation côté enseignant) — placé au-dessus de la barre d'onglets, pas derrière.

Un utilisateur ne doit jamais pouvoir atteindre un groupe qui n'est pas le sien, même par lien
profond : le `_layout` de chaque groupe vérifie le rôle et redirige.

## Composants

À écrire une fois dans `composants/`, jamais recopiés dans un écran :

- **Carte** : fond blanc, bordure `bordureCarte`, rayon 16, padding 16.
- **BadgeEtat** : pastille 999, 12/700, icône à gauche, paire de couleurs d'état.
- **Avatar** : cercle 30–38, initiales 11–13/700.
- **Champ** : 52 pt, rayon 12, fond `fondChamp`, bordure accent au focus.
- **Onglets** : conteneur `separateur`, onglet actif blanc rayon 9.
- **Ligne de liste** : hauteur minimale 56 pt, séparateur 1 px `separateur`.
- **Alerte** : `accessibilityRole="alert"`, rayon 10, paire d'état.
- **ÉtatVide** : icône, une phrase, une action. Jamais une liste vide muette.
- **BandeauHorsLigne** : barre persistante quand le réseau est coupé, avec le nombre de
  modifications en attente.

Icônes Font Awesome importées **une par une** (`faGraduationCap`, `faPaperPlane`, `faLock`…),
jamais le pack entier : le bundle mobile le paie au démarrage.

## La grille de saisie — écran critique

C'est la raison d'être de l'app côté enseignant. Exigences fermes :

- **Liste virtualisée** (`FlashList` ou `FlatList` avec `getItemLayout`) : 60 élèves doivent défiler
  sans à-coup sur un téléphone d'entrée de gamme.
- Ligne : numéro, avatar + nom, champ note, bouton absent, bouton observation. En largeur
  téléphone, le numéro peut disparaître, jamais la note ni le bouton absent.
- Champ note : `keyboardType="decimal-pad"`, `selectTextOnFocus`, centré, 17/700.
- **Passage à l'élève suivant** : touche « suivant » du clavier (`returnKeyType="next"`) et
  défilement automatique vers la ligne visée. L'équivalent mobile du « Entrée ou ↓ » du web.
- **Le clavier ne doit jamais masquer la ligne en cours** : `KeyboardAvoidingView` et défilement
  vers la ligne active à chaque focus.
- **Absent est un bouton à bascule, jamais une valeur tapée.** RG11 : absent et 0 sont deux choses
  différentes, et l'interface doit rendre la confusion impossible.
- Note hors bornes refusée à la frappe, message sous la ligne concernée.
- **Barre de synthèse fixe en bas** : moyenne, min, max, absents, état de sauvegarde, bouton
  Soumettre. Au-dessus du clavier quand il est ouvert.
- **État de sauvegarde toujours visible** : enregistré / en cours / en attente de réseau. Un
  enseignant qui ne sait pas si sa saisie est partie la refait.
- Évaluation validée → grille en lecture seule, bandeau cadenas avec explication. Jamais des champs
  grisés sans raison affichée (RG12).

## Côté famille

- Accueil : sélecteur d'enfant si plusieurs rattachements, dernière moyenne, dernier bulletin
  délivré.
- **Rien d'autre que le publié n'apparaît, jamais** (RG18). Pas de notes en attente, pas de
  moyenne provisoire, pas de classement nominatif des autres élèves. Si l'écran n'a rien à
  montrer, il affiche « En attente de publication par l'établissement ».
- Bulletin : affichage natif + téléchargement PDF ouvert dans la visionneuse du système
  (`expo-file-system` + `expo-sharing`).
- Évolution de la moyenne générale d'une période à l'autre : graphique simple, lisible sans zoom.

## Accessibilité

- `accessibilityLabel` sur tout bouton porteur d'une seule icône.
- `accessibilityRole` correct : `button`, `alert`, `header`, `tab`.
- Contraste minimum 4.5:1 — les paires d'états ci-dessus le respectent.
- La couleur ne porte jamais seule l'information : toujours une icône ou un mot.
- Respecter la taille de police système (`allowFontScaling` par défaut) ; vérifier la grille de
  saisie à 200 % avant de livrer.

## Performance

Téléphones d'entrée de gamme, réseau lent ou intermittent.

- Listes virtualisées partout, pagination côté serveur.
- Images distantes redimensionnées côté serveur, `expo-image` avec cache.
- Démarrage à froid sous 3 s jusqu'au premier écran utile.
- Pas de bibliothèque de composants lourde : les écrans sont simples, les jetons suffisent.
