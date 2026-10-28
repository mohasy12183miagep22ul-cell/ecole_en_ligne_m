import { api } from '@/api/client';
import type {
  DetailEvaluation,
  EtatChange,
  EvaluationsAValider,
  InscriptionsAValider,
  Suivi,
} from '@/api/types';

/** Espace direction : validation (RG12), suivi des saisies (RG13), inscriptions (RG5 à RG8). */

export function evaluationsDirection(filtre: { etat?: 'soumise' | 'validee'; page?: number } = {}) {
  return api<EvaluationsAValider>('/direction/evaluations', { requete: filtre });
}

export function detailEvaluation(evaluationId: number) {
  return api<DetailEvaluation>(`/direction/evaluations/${evaluationId}`);
}

export function validerEvaluation(evaluationId: number) {
  return api<EtatChange>(`/direction/evaluations/${evaluationId}/valider`, { methode: 'POST' });
}

/** Renvoie à l'enseignant (retour au brouillon). Motif de 5 à 250 caractères. */
export function renvoyerEvaluation(evaluationId: number, motif: string) {
  return api<EtatChange>(`/direction/evaluations/${evaluationId}/renvoyer`, {
    methode: 'POST',
    corps: { motif },
  });
}

/** Déverrouille une évaluation validée (chef d'établissement, journalisé). */
export function deverrouillerEvaluation(evaluationId: number, motif: string) {
  return api<EtatChange>(`/direction/evaluations/${evaluationId}/deverrouiller`, {
    methode: 'POST',
    corps: { motif },
  });
}

export function suiviSaisies(filtre: { periode?: number; classe?: number } = {}) {
  return api<Suivi>('/direction/suivi', { requete: filtre });
}

/** Rouvre la saisie d'une affectation jusqu'à une date (AAAA-MM-JJ). */
export function accorderDerogation(donnees: {
  affectationId: number;
  periodeId: number;
  jusquAu: string;
  motif: string;
}) {
  return api<{ jusquAu: string }>('/direction/derogations', { methode: 'POST', corps: donnees });
}

export function inscriptionsAValider(page = 1) {
  return api<InscriptionsAValider>('/direction/inscriptions', { requete: { page } });
}

/** `forcer` dépasse la capacité de la classe, avec motif obligatoire (RG7). */
export function validerInscription(
  inscriptionId: number,
  donnees: { classeId: number; forcer?: boolean; motifDepassement?: string }
) {
  return api<{ inscription: { id: number; etat: 'valide' } }>(
    `/direction/inscriptions/${inscriptionId}/valider`,
    { methode: 'POST', corps: donnees }
  );
}

export function refuserInscription(inscriptionId: number, motif: string) {
  return api<{ inscription: { id: number; etat: 'refuse' } }>(
    `/direction/inscriptions/${inscriptionId}/refuser`,
    { methode: 'POST', corps: { motif } }
  );
}
