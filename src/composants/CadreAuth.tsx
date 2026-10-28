import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icone } from '@/composants/Icone';
import { faGraduationCap } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces, rayons } from '@/theme/tokens';

export const NOM_ETABLISSEMENT = process.env.EXPO_PUBLIC_ETABLISSEMENT ?? 'Groupe scolaire Les Flamboyants';

/** Cadre des écrans hors connexion : marque en haut, formulaire au-dessus du clavier. */
export function CadreAuth({ children, accueil }: { children: ReactNode; accueil?: boolean }) {
  const insets = useSafeAreaInsets();
  const { acc, doux } = useAccent();
  return (
    <KeyboardAvoidingView style={styles.fond} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.contenu,
          { paddingTop: insets.top + espaces.ample, paddingBottom: insets.bottom + espaces.vaste },
        ]}>
        <View style={styles.colonne}>
          <View style={styles.marque}>
            <View style={[styles.logo, { backgroundColor: acc }]}>
              <Icone icone={faGraduationCap} taille={18} couleur={couleurs.blanc} />
            </View>
            <View>
              <Texte taille="xl" graisse={800}>
                École en ligne
              </Texte>
              <Texte taille="s" couleur={couleurs.texteSecondaire}>
                {NOM_ETABLISSEMENT}
              </Texte>
            </View>
          </View>
          {accueil ? (
            <View style={[styles.illustration, { backgroundColor: doux }]}>
              <Icone icone={faGraduationCap} taille={44} couleur={acc} />
              <Texte taille="base" couleur={couleurs.texteSecondaire} centre>
                Inscriptions, notes et bulletins réunis dans un seul espace — pour l’établissement, les enseignants et
                les familles.
              </Texte>
            </View>
          ) : null}
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: couleurs.blanc },
  contenu: { flexGrow: 1, paddingHorizontal: espaces.ample, justifyContent: 'center' },
  colonne: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: espaces.ample },
  marque: { flexDirection: 'row', alignItems: 'center', gap: espaces.l },
  logo: { width: 40, height: 40, borderRadius: rayons.moyen, alignItems: 'center', justifyContent: 'center' },
  illustration: {
    borderRadius: rayons.grand,
    padding: espaces.large,
    alignItems: 'center',
    gap: espaces.xl,
  },
});
