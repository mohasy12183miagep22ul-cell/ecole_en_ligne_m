import { StyleSheet, View } from 'react-native';

import { Texte } from '@/composants/Texte';
import { couleurs, espaces } from '@/theme/tokens';

/** Paire libellé / valeur (fiches, dossiers). */
export function Donnee({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View style={styles.donnee}>
      <Texte taille="s" couleur={couleurs.texteSecondaire}>
        {libelle}
      </Texte>
      <Texte taille="l" graisse={600}>
        {valeur}
      </Texte>
    </View>
  );
}

/** Grille de données sur deux colonnes. */
export function GrilleDonnees({ donnees }: { donnees: [string, string][] }) {
  return (
    <View style={styles.grille}>
      {donnees.map(([k, v]) => (
        <View key={k} style={styles.cellule}>
          <Donnee libelle={k} valeur={v} />
        </View>
      ))}
    </View>
  );
}

/** Ligne libellé à gauche, valeur à droite (récapitulatifs de confirmation). */
export function LigneDonnee({ libelle, valeur, premiere }: { libelle: string; valeur: string; premiere?: boolean }) {
  return (
    <View style={[styles.ligne, !premiere && styles.ligneSeparee]}>
      <Texte taille="m" couleur={couleurs.texteSecondaire} style={styles.flex}>
        {libelle}
      </Texte>
      <Texte taille="m" graisse={700} style={styles.droite}>
        {valeur}
      </Texte>
    </View>
  );
}

const styles = StyleSheet.create({
  donnee: { gap: 3 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', rowGap: espaces.xxl },
  cellule: { width: '50%', paddingRight: espaces.page },
  ligne: {
    flexDirection: 'row',
    gap: espaces.xl,
    paddingHorizontal: espaces.xxl,
    paddingVertical: espaces.l,
  },
  ligneSeparee: { borderTopWidth: 1, borderTopColor: couleurs.separateur },
  flex: { flex: 1 },
  droite: { textAlign: 'right', flexShrink: 1 },
});
