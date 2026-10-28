import { Stack } from 'expo-router';

import { useSynchronisation } from '@/saisie/synchronisation';
import { FournisseurAccent } from '@/theme/accent';
import { accents, couleurs } from '@/theme/tokens';

/** Espace enseignant : onglets, puis grille de saisie et création par-dessus. */
export default function EnseignantLayout() {
  // Les notes en attente partent dès le retour du réseau, quel que soit l'écran.
  useSynchronisation();
  return (
    <FournisseurAccent accent={accents.enseignant}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fondPage } }}>
        <Stack.Screen name="(onglets)" />
        <Stack.Screen name="evaluation/[id]" />
        <Stack.Screen name="nouvelle-evaluation" options={{ presentation: 'modal' }} />
      </Stack>
    </FournisseurAccent>
  );
}
