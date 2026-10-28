import { StyleSheet, View } from 'react-native';

import { useAccent } from '@/theme/accent';
import { couleurs } from '@/theme/tokens';

/** Barre de progression fine. `ratio` entre 0 et 1. */
export function Barre({ ratio, couleur, epaisseur = 6 }: { ratio: number; couleur?: string; epaisseur?: number }) {
  const { acc } = useAccent();
  const r = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  return (
    <View style={[styles.piste, { height: epaisseur, borderRadius: epaisseur / 2 }]}>
      <View style={{ width: `${r * 100}%`, height: '100%', borderRadius: epaisseur / 2, backgroundColor: couleur ?? acc }} />
    </View>
  );
}

const styles = StyleSheet.create({
  piste: { flex: 1, backgroundColor: couleurs.separateur, overflow: 'hidden' },
});
