import { StyleSheet, type ColorValue } from 'react-native';

import { Entete } from '@/composants/Entete';
import { Icone, type IconeDef } from '@/composants/Icone';
import type { Accent } from '@/theme/tokens';
import { couleurs, polices, tailles } from '@/theme/tokens';

/**
 * Options communes des barres d'onglets : icône 18 pt + libellé 11 pt,
 * actif en accent, entête mobile de 60 pt.
 */
export function optionsOnglets(accent: Accent) {
  return {
    tabBarActiveTintColor: accent.acc,
    tabBarInactiveTintColor: couleurs.texteTertiaire,
    tabBarStyle: styles.barre,
    tabBarLabelStyle: styles.libelle,
    header: ({ options }: { options: { title?: string } }) => <Entete titre={options.title ?? ''} />,
  };
}

export function iconeOnglet(icone: IconeDef) {
  const rendu = ({ color }: { color: ColorValue }) => <Icone icone={icone} taille={18} couleur={String(color)} />;
  return rendu;
}

const styles = StyleSheet.create({
  barre: {
    backgroundColor: couleurs.blanc,
    borderTopColor: couleurs.bordureCarte,
  },
  libelle: { fontFamily: polices[600], fontSize: tailles.xs },
});
