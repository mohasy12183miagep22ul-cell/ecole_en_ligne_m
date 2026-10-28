import { useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccent } from '@/theme/accent';
import { couleurs, dimensions, espaces } from '@/theme/tokens';

/**
 * Corps d'écran défilant : fond de page, marges de 16, tirer pour
 * rafraîchir si `rafraichir` est fourni. `basLibre` réserve la place d'un
 * bouton flottant.
 */
export function Ecran({
  children,
  rafraichir,
  sousOnglets,
  basLibre,
}: {
  children: ReactNode;
  rafraichir?: () => Promise<unknown>;
  /** Écran sous une barre d'onglets : la zone sûre du bas est déjà gérée. */
  sousOnglets?: boolean;
  basLibre?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { acc } = useAccent();
  const [actif, setActif] = useState(false);

  const tirer = rafraichir
    ? async () => {
        setActif(true);
        try {
          await rafraichir();
        } finally {
          setActif(false);
        }
      }
    : undefined;

  const bas = (sousOnglets ? 0 : insets.bottom) + (basLibre ? dimensions.fab + espaces.ample : 0) + espaces.vaste;

  return (
    <ScrollView
      style={styles.fond}
      contentContainerStyle={[styles.contenu, { paddingBottom: bas }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={tirer ? <RefreshControl refreshing={actif} onRefresh={tirer} tintColor={acc} colors={[acc]} /> : undefined}>
      <View style={styles.colonne}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: couleurs.fondPage },
  contenu: { padding: espaces.page },
  colonne: { gap: espaces.page, width: '100%', maxWidth: 720, alignSelf: 'center' },
});
