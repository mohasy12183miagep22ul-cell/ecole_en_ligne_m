import { api } from '@/api/client';
import { effacerJeton, enregistrerJeton } from '@/api/jeton';
import type { Moi, ReponseConnexion, Utilisateur } from '@/api/types';

/** Garde le jeton d'une connexion aboutie ; renvoie la réponse telle quelle. */
async function retenir(reponse: ReponseConnexion) {
  if (reponse.statut === 'connecte') await enregistrerJeton(reponse.jeton.jeton);
  return reponse;
}

/**
 * Connexion. Pour un compte direction ou administrateur, la réponse est un
 * défi de second facteur (`statut: 'double_facteur'`) : demander le code
 * reçu par courriel, puis appeler `verifierCode`.
 */
export async function connexion(email: string, password: string, appareil?: string) {
  return retenir(
    await api<ReponseConnexion>('/auth/connexion', {
      methode: 'POST',
      corps: { email, password, appareil },
      anonyme: true,
    })
  );
}

export async function verifierCode(defi: string, code: string, appareil?: string) {
  return retenir(
    await api<ReponseConnexion>('/auth/verification', {
      methode: 'POST',
      corps: { defi, code, appareil },
      anonyme: true,
    })
  );
}

/** Nouveau code pour le même défi ; l'ancien devient invalide. */
export function renvoyerCode(defi: string) {
  return api<ReponseConnexion>('/auth/verification/renvoyer', {
    methode: 'POST',
    corps: { defi },
    anonyme: true,
  });
}

/** Même réponse que le compte existe ou non. Le lien s'ouvre dans le navigateur. */
export function motDePasseOublie(email: string) {
  return api<{ message: string; lienDeveloppement: string | null }>('/auth/mot-de-passe-oublie', {
    methode: 'POST',
    corps: { email },
    anonyme: true,
  });
}

/** Révoque le jeton côté serveur, puis l'efface de l'appareil quoi qu'il arrive. */
export async function deconnexion() {
  try {
    await api<void>('/auth/deconnexion', { methode: 'POST' });
  } finally {
    await effacerJeton();
  }
}

export function moi() {
  return api<Moi>('/moi');
}

/** Lève aussi le changement imposé à la première connexion. */
export function changerMotDePasse(actuel: string, nouveau: string, confirmation: string) {
  return api<{ utilisateur: Utilisateur }>('/moi/mot-de-passe', {
    methode: 'PUT',
    corps: { actuel, nouveau, confirmation },
  });
}
