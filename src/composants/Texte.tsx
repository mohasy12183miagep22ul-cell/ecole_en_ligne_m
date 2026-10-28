import { StyleSheet, Text, type TextProps } from 'react-native';

import { couleurs, polices, tailles, type Graisse } from '@/theme/tokens';

type Props = TextProps & {
  taille?: keyof typeof tailles;
  graisse?: Graisse;
  couleur?: string;
  centre?: boolean;
  italique?: boolean;
};

/** Texte en Plus Jakarta Sans. La graisse choisit le fichier de police. */
export function Texte({
  taille = 'base',
  graisse = 400,
  couleur = couleurs.texte,
  centre,
  italique,
  style,
  ...reste
}: Props) {
  return (
    <Text
      {...reste}
      style={[
        styles.base,
        {
          fontFamily: polices[graisse],
          fontSize: tailles[taille],
          lineHeight: Math.round(tailles[taille] * 1.4),
          color: couleur,
        },
        centre && styles.centre,
        italique && styles.italique,
        style,
      ]}
    />
  );
}

/** Petit titre de section en capitales (« DERNIER BULLETIN DÉLIVRÉ »). */
export function SurTitre({ children, couleur = couleurs.texteSecondaire }: { children: string; couleur?: string }) {
  return (
    <Texte taille="s" graisse={700} couleur={couleur} style={styles.surTitre} accessibilityRole="header">
      {children.toUpperCase()}
    </Texte>
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
  centre: { textAlign: 'center' },
  italique: { fontStyle: 'italic' },
  surTitre: { letterSpacing: 0.7 },
});
