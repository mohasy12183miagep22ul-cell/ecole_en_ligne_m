import { Stack } from 'expo-router';

import { FournisseurEnfant } from '@/famille/enfant';
import { FournisseurAccent } from '@/theme/accent';
import { accents, couleurs } from '@/theme/tokens';

/** Portail famille : lecture seule, limitée aux élèves rattachés au compte (RG20). */
export default function FamilleLayout() {
  return (
    <FournisseurAccent accent={accents.portail}>
      <FournisseurEnfant>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fondPage } }}>
          <Stack.Screen name="(onglets)" />
        </Stack>
      </FournisseurEnfant>
    </FournisseurAccent>
  );
}
