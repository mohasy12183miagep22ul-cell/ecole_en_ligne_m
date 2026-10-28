import { useEffect } from 'react';

import { envoyerTout, useFile } from '@/saisie/file';
import { useEnLigne } from '@/saisie/reseau';

const INTERVALLE_MS = 20_000;

/**
 * Vide la file des saisies dès que le réseau revient, puis à intervalle
 * régulier tant qu'il reste des saisies en attente. Monté dans l'espace
 * enseignant : l'envoi ne dépend pas de l'écran ouvert.
 */
export function useSynchronisation() {
  const enLigne = useEnLigne();
  const { pret, total } = useFile();
  const aEnvoyer = total > 0;

  useEffect(() => {
    if (!pret || !enLigne || !aEnvoyer) return;
    envoyerTout();
    const minuterie = setInterval(envoyerTout, INTERVALLE_MS);
    return () => clearInterval(minuterie);
  }, [pret, enLigne, aEnvoyer]);
}
