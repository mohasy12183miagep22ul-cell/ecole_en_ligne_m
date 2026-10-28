import { useNetworkState } from 'expo-network';

/** `false` seulement quand on sait le réseau coupé (état inconnu = en ligne). */
export function useEnLigne() {
  const etat = useNetworkState();
  if (etat.isConnected === false) return false;
  if (etat.isInternetReachable === false) return false;
  return true;
}
