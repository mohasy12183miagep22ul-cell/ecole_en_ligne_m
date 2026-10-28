import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icone } from '@/composants/Icone';
import { faCircleCheck } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { couleurs, dimensions, espaces, rayons } from '@/theme/tokens';

const ToastContexte = createContext<(message: string) => void>(() => {});

/** Confirmation brève en bas d'écran, au-dessus de la barre d'onglets. */
export function FournisseurToast({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  const afficher = useCallback((m: string) => {
    setMessage(m);
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => setMessage(null), 2800);
  }, []);

  useEffect(() => () => {
    if (minuterie.current) clearTimeout(minuterie.current);
  }, []);

  return (
    <ToastContexte value={afficher}>
      {children}
      {message ? (
        <View
          pointerEvents="none"
          style={[styles.enveloppe, { bottom: insets.bottom + dimensions.barreOnglets + espaces.xl }]}>
          <View style={styles.toast} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Icone icone={faCircleCheck} taille={14} couleur={couleurs.toastIcone} />
            <Texte taille="m" graisse={500} couleur={couleurs.blanc} style={styles.texte}>
              {message}
            </Texte>
          </View>
        </View>
      ) : null}
    </ToastContexte>
  );
}

export function useToast() {
  return use(ToastContexte);
}

const styles = StyleSheet.create({
  enveloppe: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: espaces.page },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaces.l,
    paddingHorizontal: espaces.page,
    paddingVertical: espaces.xl,
    borderRadius: rayons.moyen,
    backgroundColor: couleurs.toastFond,
    maxWidth: 420,
    shadowColor: couleurs.ombre,
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  texte: { flexShrink: 1 },
});
