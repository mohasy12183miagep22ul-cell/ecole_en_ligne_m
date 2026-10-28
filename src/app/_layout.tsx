import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { ApiError } from '@/api';
import { FournisseurToast } from '@/composants/Toast';
import { FournisseurSession, useSession } from '@/session/session';
import { couleurs } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

function creerClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Un refus du serveur ne se règle pas en réessayant ; une coupure, si.
        retry: (essais, e) => !(e instanceof ApiError && e.status >= 400) && essais < 2,
      },
      mutations: { retry: false },
    },
  });
}

export default function RacineLayout() {
  const [client] = useState(creerClient);
  const [policesChargees, erreurPolices] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!policesChargees && !erreurPolices) return null;

  return (
    <QueryClientProvider client={client}>
      <FournisseurSession>
        <FournisseurToast>
          <StatusBar style="dark" />
          <Navigation />
        </FournisseurToast>
      </FournisseurSession>
    </QueryClientProvider>
  );
}

/**
 * Chaque groupe n'est atteignable que par le bon profil, liens profonds
 * compris : une route gardée renvoie vers `index`, qui aiguille. Le serveur
 * reste seul juge des droits ; ces gardes ne sont que du confort.
 */
function Navigation() {
  const { etat, utilisateur } = useSession();
  const pret = etat.statut !== 'chargement';

  useEffect(() => {
    if (pret) SplashScreen.hideAsync();
  }, [pret]);

  if (!pret) return null;

  const connecte = etat.statut === 'connecte';
  const doitChanger = !!utilisateur?.doitChangerMotDePasse;
  const espaces = utilisateur?.espaces ?? [];

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fondPage } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!connecte}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={connecte && doitChanger}>
        <Stack.Screen name="mot-de-passe-impose" />
      </Stack.Protected>
      <Stack.Protected guard={connecte && !doitChanger}>
        <Stack.Protected guard={espaces.includes('enseignant')}>
          <Stack.Screen name="enseignant" />
        </Stack.Protected>
        <Stack.Protected guard={espaces.includes('direction')}>
          <Stack.Screen name="direction" />
        </Stack.Protected>
        <Stack.Protected guard={espaces.includes('portail')}>
          <Stack.Screen name="famille" />
        </Stack.Protected>
        <Stack.Screen name="profil" />
        <Stack.Screen name="web-uniquement" />
      </Stack.Protected>
    </Stack>
  );
}
