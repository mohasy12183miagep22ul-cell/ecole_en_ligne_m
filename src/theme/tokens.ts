import type { Espace } from '@/api/types';

/**
 * Jetons de design, portés depuis le prototype web (docs/prototype). Source
 * unique : aucune couleur ni taille n'est écrite en dur dans un écran ou un
 * composant.
 */

export const couleurs = {
  texte: '#1B1726',
  texteFort: '#3B3747',
  texteSecondaire: '#5E5A6B',
  texteTertiaire: '#77738A',
  texteDesactive: '#8A869A',
  blanc: '#FFFFFF',
  fondPage: '#F6F5FA',
  fondCarte: '#FFFFFF',
  fondChamp: '#F7F6FA',
  fondEntete: '#F8F7FB',
  fondDiscret: '#FBFAFD',
  bordureCarte: '#ECEAF2',
  bordureChamp: '#E6E3EE',
  bordureCase: '#BDB8CC',
  bordurePointillee: '#CFCBDA',
  separateur: '#F1F0F5',
  pisteOnglets: '#ECEAF2',
  pastilleInactive: '#DDD9E6',
  succesTexte: '#14663F',
  succesFond: '#E2F4EA',
  succesBarre: '#1F9D5C',
  attentionTexte: '#7A4A00',
  attentionFond: '#FFF3DD',
  attentionBarre: '#E7A13A',
  erreurTexte: '#A3214F',
  erreurFond: '#FCE8EF',
  erreurBordure: '#F3C9D6',
  erreurChampFond: '#FDECEC',
  erreurChampBordure: '#C42F2F',
  danger: '#C42F2F',
  infoTexte: '#2448B5',
  infoFond: '#EAF0FD',
  neutreTexte: '#4E4A5C',
  neutreFond: '#F1F0F5',
  verrouTexte: '#2F2B3A',
  verrouFond: '#E8E6EF',
  voile: 'rgba(27,23,38,0.42)',
  ombre: '#1B1726',
  toastFond: '#1B1726',
  toastIcone: '#7EE0B5',
  surAccentDoux: 'rgba(255,255,255,0.2)',
} as const;

export type Accent = { acc: string; doux: string; libelle: string };

/** Couleur d'accent par espace, comme le prototype (« envAccents »). */
export const accents: Record<Espace | 'neutre', Accent> = {
  portail: { acc: '#0E7C6B', doux: '#E3F3EF', libelle: 'Portail famille' },
  enseignant: { acc: '#2B59D9', doux: '#EAF0FD', libelle: 'Espace enseignant' },
  direction: { acc: '#7424E0', doux: '#F3ECFD', libelle: 'Direction' },
  neutre: { acc: '#7424E0', doux: '#F3ECFD', libelle: 'École en ligne' },
};

/** Paires fond / texte des avatars, choisies par l'identifiant. */
export const pairesAvatar: readonly (readonly [string, string])[] = [
  ['#F3ECFD', '#6A1FD0'],
  ['#E3F3EF', '#0B6A5B'],
  ['#EAF0FD', '#2448B5'],
  ['#FDEDE3', '#9A4510'],
  ['#FCE8EF', '#A3214F'],
];

export const polices = {
  400: 'PlusJakartaSans_400Regular',
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
} as const;

export type Graisse = keyof typeof polices;

export const tailles = {
  xs: 11,
  s: 12,
  m: 13,
  base: 14,
  l: 15,
  xl: 17,
  titre: 20,
  grand: 24,
  geant: 26,
  chiffre: 30,
} as const;

export const rayons = {
  petit: 8,
  champ: 10,
  moyen: 12,
  carte: 16,
  grand: 20,
  feuille: 22,
  pastille: 999,
} as const;

export const espaces = {
  xxs: 2,
  xs: 4,
  s: 6,
  m: 8,
  l: 10,
  xl: 12,
  xxl: 14,
  page: 16,
  section: 18,
  large: 20,
  ample: 24,
  vaste: 28,
} as const;

export const dimensions = {
  /** Zone tactile minimale. */
  cible: 44,
  champ: 52,
  bouton: 50,
  boutonSecondaire: 46,
  entete: 60,
  fab: 56,
  ligneListe: 56,
  barreOnglets: 60,
  icone: 18,
  logo: 34,
} as const;
