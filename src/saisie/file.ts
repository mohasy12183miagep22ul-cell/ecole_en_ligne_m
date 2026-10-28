import { useEffect, useSyncExternalStore } from 'react';

import { ApiError, enregistrerNotes } from '@/api';
import type { ResultatSaisies, SaisieNote } from '@/api/types';
import { effacer, ecrire, lire } from '@/saisie/stockage';

/**
 * File d'attente des notes saisies (docs/api.md, « Hors ligne »).
 *
 * Chaque modification est écrite tout de suite sur l'appareil, rangée par
 * évaluation puis par élève : la dernière saisie d'un élève remplace la
 * précédente. La file est ensuite envoyée par lots (200 au plus). Le serveur
 * ignore une saisie identique à la valeur enregistrée : renvoyer toute la
 * file après une coupure est sans risque.
 *
 * Un refus par une règle de gestion (RG12 évaluation fermée, RG13 fenêtre
 * close) ne vide pas la file : la saisie reste visible comme rejetée, et
 * c'est l'enseignant qui décide de l'abandonner.
 */

const CLE = 'ecole_en_ligne.saisies';
const LOT = 200;

type Contenu = {
  utilisateurId: number | null;
  evaluations: Record<string, Record<string, SaisieNote>>;
};

let contenu: Contenu = { utilisateurId: null, evaluations: {} };
let chargement: Promise<void> | null = null;
let pret = false;
let version = 0;
const rejets = new Map<number, string>();
const enVol = new Map<number, Promise<ResultatSaisies | null>>();
const ecouteurs = new Set<() => void>();

function notifier() {
  version += 1;
  ecouteurs.forEach((e) => e());
}

export function chargerFile() {
  chargement ??= (async () => {
    try {
      const brut = await lire(CLE);
      if (brut) contenu = JSON.parse(brut) as Contenu;
    } catch {
      // File illisible : on repart d'une file vide plutôt que de bloquer l'app.
    }
    pret = true;
    notifier();
  })();
  return chargement;
}

async function persister() {
  await ecrire(CLE, JSON.stringify(contenu));
}

/** La file appartient à un compte : un autre compte sur l'appareil la purge. */
export async function associerUtilisateur(id: number) {
  await chargerFile();
  if (contenu.utilisateurId === id) return;
  contenu = { utilisateurId: id, evaluations: {} };
  rejets.clear();
  await persister();
  notifier();
}

/** Purge à la déconnexion : rien ne reste sur l'appareil. */
export async function viderFile() {
  await chargerFile();
  contenu = { utilisateurId: null, evaluations: {} };
  rejets.clear();
  await effacer(CLE);
  notifier();
}

export async function mettreEnFile(evaluationId: number, saisie: SaisieNote) {
  await chargerFile();
  const file = (contenu.evaluations[evaluationId] ??= {});
  file[saisie.eleveId] = saisie;
  rejets.delete(evaluationId);
  await persister();
  notifier();
}

export function enAttente(evaluationId: number): SaisieNote[] {
  return Object.values(contenu.evaluations[evaluationId] ?? {});
}

export function totalEnAttente() {
  return Object.values(contenu.evaluations).reduce((n, f) => n + Object.keys(f).length, 0);
}

export function rejetDe(evaluationId: number) {
  return rejets.get(evaluationId) ?? null;
}

/** Abandonne les saisies en attente d'une évaluation (après un refus du serveur). */
export async function abandonner(evaluationId: number) {
  await chargerFile();
  delete contenu.evaluations[evaluationId];
  rejets.delete(evaluationId);
  await persister();
  notifier();
}

const egales = (a: SaisieNote, b: SaisieNote | undefined) =>
  !!b && a.valeur === b.valeur && a.absent === b.absent && (a.observation ?? null) === (b.observation ?? null);

/** Une erreur qui ne se règle pas en réessayant : refus du serveur. */
function estRefus(e: unknown) {
  return e instanceof ApiError && !e.horsLigne && e.status >= 400 && e.status < 500 && e.status !== 401;
}

async function envoyerLots(evaluationId: number): Promise<ResultatSaisies | null> {
  let dernier: ResultatSaisies | null = null;
  for (;;) {
    const lot = enAttente(evaluationId).slice(0, LOT);
    if (!lot.length) return dernier;
    try {
      dernier = await enregistrerNotes(evaluationId, lot);
    } catch (e) {
      if (estRefus(e)) {
        rejets.set(evaluationId, (e as ApiError).message);
        notifier();
      }
      throw e;
    }
    // Ne retire que ce qui n'a pas été modifié pendant l'envoi.
    const file = contenu.evaluations[evaluationId] ?? {};
    for (const s of lot) if (egales(s, file[s.eleveId])) delete file[s.eleveId];
    if (!Object.keys(file).length) delete contenu.evaluations[evaluationId];
    rejets.delete(evaluationId);
    await persister();
    notifier();
  }
}

/**
 * Envoie la file d'une évaluation. Un seul envoi à la fois par évaluation ;
 * un appel pendant un envoi en cours attend sa fin puis renvoie le reste.
 */
export async function envoyer(evaluationId: number): Promise<ResultatSaisies | null> {
  await chargerFile();
  const precedent = enVol.get(evaluationId);
  if (precedent) await precedent.catch(() => null);
  if (rejets.has(evaluationId)) return null;
  const envoi = envoyerLots(evaluationId).finally(() => enVol.delete(evaluationId));
  enVol.set(evaluationId, envoi);
  return envoi;
}

/** Renvoie toutes les files en attente, sauf celles refusées par le serveur. */
export async function envoyerTout() {
  await chargerFile();
  for (const id of Object.keys(contenu.evaluations).map(Number)) {
    if (rejets.has(id)) continue;
    try {
      await envoyer(id);
    } catch (e) {
      if (e instanceof ApiError && (e.horsLigne || e.status === 401)) return;
    }
  }
}

function abonner(ecouteur: () => void) {
  ecouteurs.add(ecouteur);
  return () => {
    ecouteurs.delete(ecouteur);
  };
}

/** Rend le composant sensible aux changements de la file ; `pret` une fois lue sur l'appareil. */
export function useFile() {
  useEffect(() => {
    chargerFile();
  }, []);
  useSyncExternalStore(abonner, () => version, () => version);
  return { pret, total: totalEnAttente() };
}
