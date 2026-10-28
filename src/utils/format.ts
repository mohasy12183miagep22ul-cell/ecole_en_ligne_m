import { pairesAvatar } from '@/theme/tokens';

/**
 * Le serveur n'arrondit jamais (RG15) : l'arrondi à deux décimales se fait
 * ici, à l'affichage, et seulement là.
 */
export function nombre(n: number | null | undefined, decimales = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toFixed(decimales).replace('.', ',');
}

/** Valeur telle que saisie (12,5), sans zéros superflus. */
export function valeurSaisie(n: number | null | undefined) {
  if (n === null || n === undefined) return '';
  return String(n).replace('.', ',');
}

/** « 12,5 » ou « 12.5 » → 12.5 ; chaîne vide → null ; autre chose → NaN. */
export function lireNombre(texte: string) {
  const t = texte.trim().replace(',', '.');
  if (t === '') return null;
  if (!/^\d+(\.\d+)?$/.test(t)) return Number.NaN;
  return Number(t);
}

export function pourcentage(ratio: number | null | undefined) {
  if (ratio === null || ratio === undefined) return '—';
  return `${Math.round(ratio * 100)} %`;
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** AAAA-MM-JJ → 04/11/2026 */
export function dateCourte(iso: string | null | undefined) {
  if (!iso) return '—';
  const [a, m, j] = iso.slice(0, 10).split('-');
  return `${j}/${m}/${a}`;
}

/** AAAA-MM-JJ → 4 nov. 2026 */
export function dateLongue(iso: string | null | undefined) {
  if (!iso) return '—';
  const [a, m, j] = iso.slice(0, 10).split('-').map(Number);
  return `${j} ${MOIS[m - 1]} ${a}`;
}

/** Horodatage ISO → 14:03 (heure locale). */
export function heure(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function aujourdhui() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateValide(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [a, m, j] = iso.split('-').map(Number);
  const d = new Date(a, m - 1, j);
  return d.getFullYear() === a && d.getMonth() === m - 1 && d.getDate() === j;
}

export function initiales(nom: string, prenoms = '') {
  const a = prenoms.trim()[0] ?? '';
  const b = nom.trim()[0] ?? '';
  return (a + b).toUpperCase() || '?';
}

export function paireAvatar(cle: number | string) {
  const n = typeof cle === 'number' ? cle : [...cle].reduce((s, c) => s + c.charCodeAt(0), 0);
  return pairesAvatar[Math.abs(n) % pairesAvatar.length];
}

export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`) {
  return `${n} ${n > 1 ? plurielForme : singulier}`;
}

/** 1 → 1er, 3 → 3e */
export function rang(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return n === 1 ? '1er' : `${n}e`;
}
