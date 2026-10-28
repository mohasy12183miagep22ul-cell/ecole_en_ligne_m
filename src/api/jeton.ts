import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CLE = 'ecole_en_ligne.jeton';

/**
 * Jeton d'accès : trousseau iOS / Keystore Android via SecureStore. Sur le
 * web (pas de SecureStore), il ne vit qu'en mémoire, le temps de l'onglet.
 */
let memoire: string | null = null;

export async function lireJeton() {
  if (Platform.OS === 'web') return memoire;
  try {
    return await SecureStore.getItemAsync(CLE);
  } catch {
    return null;
  }
}

export async function enregistrerJeton(jeton: string) {
  memoire = jeton;
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(CLE, jeton, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function effacerJeton() {
  memoire = null;
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.deleteItemAsync(CLE);
  } catch {
    // Rien à effacer.
  }
}
