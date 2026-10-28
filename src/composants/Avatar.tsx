import { StyleSheet, View } from 'react-native';

import { Texte } from '@/composants/Texte';
import { tailles } from '@/theme/tokens';

/** Cercle aux initiales. Décoratif : le nom est toujours écrit à côté. */
export function Avatar({
  initiales,
  fond,
  texte,
  taille = 30,
}: {
  initiales: string;
  fond: string;
  texte: string;
  taille?: number;
}) {
  const police: keyof typeof tailles = taille >= 52 ? 'titre' : taille >= 36 ? 'm' : taille >= 32 ? 's' : 'xs';
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.avatar, { width: taille, height: taille, borderRadius: taille / 2, backgroundColor: fond }]}>
      <Texte taille={police} graisse={taille >= 52 ? 800 : 700} couleur={texte} maxFontSizeMultiplier={1.2}>
        {initiales}
      </Texte>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
