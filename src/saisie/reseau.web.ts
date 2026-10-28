import { useSyncExternalStore } from 'react';

/**
 * Sur le web, expo-network ne connaît pas le type de connexion et répond
 * « déconnecté » même en ligne : on s'en tient à `navigator.onLine`.
 */
function abonner(ecouteur: () => void) {
  window.addEventListener('online', ecouteur);
  window.addEventListener('offline', ecouteur);
  return () => {
    window.removeEventListener('online', ecouteur);
    window.removeEventListener('offline', ecouteur);
  };
}

export function useEnLigne() {
  return useSyncExternalStore(
    abonner,
    () => navigator.onLine,
    () => true
  );
}
