import { api } from '@/api/client';
import type { DossierEnfant, Enfant } from '@/api/types';

/**
 * Portail famille, lecture seule (RG20). Les notes et bulletins n'y
 * figureront qu'après publication par la direction (RG18), avec le lot des
 * bulletins côté serveur.
 */

export function mesEnfants() {
  return api<{ enfants: Enfant[] }>('/portail/enfants');
}

/** `id` est l'identifiant opaque reçu dans `mesEnfants`. */
export function dossierEnfant(id: string) {
  return api<{ enfant: DossierEnfant }>(`/portail/enfants/${encodeURIComponent(id)}`);
}
