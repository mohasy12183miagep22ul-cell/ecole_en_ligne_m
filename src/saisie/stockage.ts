import Storage from 'expo-sqlite/kv-store';

/**
 * Stockage durable de la file des saisies : SQLite, dans le répertoire privé
 * de l'application. Il survit à la fermeture de l'app et au redémarrage.
 */
export function lire(cle: string) {
  return Storage.getItem(cle);
}

export function ecrire(cle: string, valeur: string) {
  return Storage.setItem(cle, valeur);
}

export function effacer(cle: string) {
  return Storage.removeItem(cle);
}
