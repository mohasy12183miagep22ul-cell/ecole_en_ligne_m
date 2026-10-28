import { Pressable, StyleSheet } from 'react-native';

import { Icone, type IconeDef } from '@/composants/Icone';
import { useAccent } from '@/theme/accent';
import { couleurs, dimensions, espaces } from '@/theme/tokens';

/** Action principale de l'écran : 56 pt en bas à droite, au-dessus de la barre d'onglets. */
export function BoutonFlottant({ icone, libelle, onPress }: { icone: IconeDef; libelle: string; onPress: () => void }) {
  const { acc } = useAccent();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={libelle}
      style={({ pressed }) => [styles.fab, { backgroundColor: acc }, pressed && styles.presse]}>
      <Icone icone={icone} taille={20} couleur={couleurs.blanc} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: espaces.section,
    bottom: espaces.section,
    width: dimensions.fab,
    height: dimensions.fab,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: couleurs.ombre,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  presse: { opacity: 0.85 },
});
