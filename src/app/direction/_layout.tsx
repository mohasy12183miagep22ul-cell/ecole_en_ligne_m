import { Stack } from 'expo-router';

import { FournisseurAccent } from '@/theme/accent';
import { accents, couleurs } from '@/theme/tokens';

/** Espace direction : validation (RG12), suivi des saisies (RG13), inscriptions (RG5 à RG8). */
export default function DirectionLayout() {
  return (
    <FournisseurAccent accent={accents.direction}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fondPage } }}>
        <Stack.Screen name="(onglets)" />
        <Stack.Screen name="evaluation/[id]" />
      </Stack>
    </FournisseurAccent>
  );
}
