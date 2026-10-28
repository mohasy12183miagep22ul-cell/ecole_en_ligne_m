import { Stack } from 'expo-router';
import { useState } from 'react';

import { FournisseurAccent } from '@/theme/accent';
import { accents } from '@/theme/tokens';
import { AccentAuthContexte } from '@/session/accent-auth';

/** Écrans hors connexion. L'accent suit le profil de démonstration choisi (développement). */
export default function AuthLayout() {
  const [accent, setAccent] = useState(accents.neutre);
  return (
    <AccentAuthContexte value={setAccent}>
      <FournisseurAccent accent={accent}>
        <Stack screenOptions={{ headerShown: false }} />
      </FournisseurAccent>
    </AccentAuthContexte>
  );
}
