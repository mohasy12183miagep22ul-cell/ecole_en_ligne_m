/**
 * Sur le web, la file ne vit qu'en mémoire, le temps de l'onglet : pas de
 * noms d'élèves ni de notes en clair dans le stockage du navigateur.
 */
const memoire = new Map<string, string>();

export async function lire(cle: string) {
  return memoire.get(cle) ?? null;
}

export async function ecrire(cle: string, valeur: string) {
  memoire.set(cle, valeur);
}

export async function effacer(cle: string) {
  memoire.delete(cle);
}
