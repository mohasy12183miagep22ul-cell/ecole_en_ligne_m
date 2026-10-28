import type { LigneGrille, SaisieNote } from '@/api/types';
import { lireNombre, valeurSaisie } from '@/utils/format';

/** État local d'une ligne de la grille : le texte tel que tapé. */
export type Cellule = { texte: string; absent: boolean; observation: string };

/** Valeurs du serveur, recouvertes par les saisies encore en attente sur l'appareil. */
export function fusionner(lignes: LigneGrille[], attente: SaisieNote[]): Record<number, Cellule> {
  const parEleve = new Map(attente.map((s) => [s.eleveId, s]));
  const cellules: Record<number, Cellule> = {};
  for (const l of lignes) {
    const s = parEleve.get(l.id);
    cellules[l.id] = s
      ? { texte: valeurSaisie(s.valeur), absent: s.absent, observation: s.observation ?? '' }
      : { texte: valeurSaisie(l.valeur), absent: l.absent, observation: l.observation ?? '' };
  }
  return cellules;
}

/**
 * Contrôle à la frappe (RG10) : nombre décimal (virgule ou point, deux
 * décimales au plus) entre 0 et la note maximale. Renvoie le message
 * d'erreur, ou null si la saisie est acceptable. Un champ vide n'est pas un 0.
 */
export function controler(texte: string, noteMax: number) {
  const t = texte.trim();
  if (t === '') return null;
  if (!/^\d{1,3}([.,]\d{0,2})?$/.test(t)) return 'Saisissez un nombre, ex. 12,5';
  const n = lireNombre(t.replace(/[.,]$/, ''));
  if (n === null || Number.isNaN(n)) return 'Saisissez un nombre, ex. 12,5';
  if (n < 0 || n > noteMax) return `Note refusée : elle doit être comprise entre 0 et ${valeurSaisie(noteMax)}`;
  return null;
}

/** Saisie envoyée au serveur. RG11 : un absent n'a jamais de note. */
export function versSaisie(eleveId: number, c: Cellule): SaisieNote {
  const valeur = c.absent ? null : lireNombre(c.texte.trim().replace(/[.,]$/, ''));
  return {
    eleveId,
    absent: c.absent,
    valeur: valeur === null || Number.isNaN(valeur) ? null : valeur,
    observation: c.observation.trim() || null,
  };
}

/** Statistiques calculées sur l'appareil, dans le barème, même hors ligne. */
export function statistiques(cellules: Record<number, Cellule>) {
  const notes: number[] = [];
  let absents = 0;
  for (const c of Object.values(cellules)) {
    if (c.absent) {
      absents += 1;
      continue;
    }
    const n = lireNombre(c.texte.trim().replace(/[.,]$/, ''));
    if (n !== null && !Number.isNaN(n)) notes.push(n);
  }
  const effectif = Object.keys(cellules).length;
  return {
    moyenne: notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null,
    min: notes.length ? Math.min(...notes) : null,
    max: notes.length ? Math.max(...notes) : null,
    notes: notes.length,
    absents,
    reste: effectif - notes.length - absents,
    effectif,
  };
}
