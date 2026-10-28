import { StyleSheet, View } from 'react-native';

import { Icone } from '@/composants/Icone';
import { faPlugCircleXmark } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { useFile } from '@/saisie/file';
import { useEnLigne } from '@/saisie/reseau';
import { couleurs, espaces } from '@/theme/tokens';
import { pluriel } from '@/utils/format';

/** Barre persistante quand le réseau est coupé, avec le nombre de modifications en attente. */
export function BandeauHorsLigne() {
  const enLigne = useEnLigne();
  const { total } = useFile();
  if (enLigne) return null;
  return (
    <View style={styles.bandeau} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icone icone={faPlugCircleXmark} taille={14} couleur={couleurs.attentionTexte} />
      <Texte taille="m" graisse={600} couleur={couleurs.attentionTexte} style={styles.texte}>
        {total
          ? `Hors ligne · ${pluriel(total, 'modification conservée', 'modifications conservées')} sur l’appareil`
          : 'Hors ligne · les données affichées peuvent dater'}
      </Texte>
    </View>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaces.l,
    paddingHorizontal: espaces.page,
    paddingVertical: espaces.l,
    backgroundColor: couleurs.attentionFond,
  },
  texte: { flex: 1 },
});
