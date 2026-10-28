import { api } from '@/api/client';
import type {
  Appreciations,
  EvaluationListe,
  Evaluation,
  Grille,
  MesAffectations,
  ModificationEvaluation,
  NouvelleEvaluation,
  Pagination,
  PeriodeAffectation,
  Recapitulatif,
  ResultatSaisies,
  SaisieNote,
  TypeEvaluation,
} from '@/api/types';

/** Espace enseignant : tout part des affectations de l'année active (RG9). */

export function mesAffectations() {
  return api<MesAffectations>('/enseignant/affectations');
}

export function periodesDe(affectationId: number) {
  return api<{ periodes: PeriodeAffectation[] }>(`/enseignant/affectations/${affectationId}/periodes`);
}

export function typesEvaluation() {
  return api<{ types: { cle: TypeEvaluation; libelle: string }[] }>(
    '/enseignant/types-evaluation'
  );
}

export function mesEvaluations(filtre: { affectation?: number; page?: number } = {}) {
  return api<{ evaluations: EvaluationListe[]; pagination: Pagination }>('/enseignant/evaluations', {
    requete: filtre,
  });
}

export function creerEvaluation(donnees: NouvelleEvaluation) {
  return api<{ evaluation: Evaluation }>('/enseignant/evaluations', {
    methode: 'POST',
    corps: donnees,
  });
}

export function grille(evaluationId: number) {
  return api<Grille>(`/enseignant/evaluations/${evaluationId}`);
}

/** Évaluation en brouillon seulement (RG12). */
export function modifierEvaluation(evaluationId: number, donnees: ModificationEvaluation) {
  return api<{ evaluation: Evaluation }>(`/enseignant/evaluations/${evaluationId}`, {
    methode: 'PUT',
    corps: donnees,
  });
}

/**
 * Enregistre un lot de 1 à 200 saisies, tout ou rien. Les saisies restées en
 * attente pendant une coupure réseau se renvoient telles quelles : le serveur
 * ignore celles qui n'ont pas changé.
 */
export function enregistrerNotes(evaluationId: number, saisies: SaisieNote[]) {
  return api<ResultatSaisies>(`/enseignant/evaluations/${evaluationId}/notes`, {
    methode: 'POST',
    corps: { saisies },
  });
}

/** Envoie l'évaluation à la direction ; la saisie est ensuite fermée. */
export function soumettreEvaluation(evaluationId: number) {
  return api<{ evaluation: Evaluation }>(`/enseignant/evaluations/${evaluationId}/soumettre`, {
    methode: 'POST',
  });
}

export function appreciations(affectation: number, periode?: number) {
  return api<Appreciations>('/enseignant/appreciations', { requete: { affectation, periode } });
}

/** 250 caractères au plus ; un texte vide efface l'appréciation. */
export function enregistrerAppreciation(donnees: {
  affectationId: number;
  periodeId: number;
  eleveId: number;
  texte: string;
}) {
  return api<{ enregistreLe: string }>('/enseignant/appreciations', {
    methode: 'PUT',
    corps: donnees,
  });
}

export function recapitulatif(affectation: number, periode?: number) {
  return api<Recapitulatif>('/enseignant/recapitulatif', { requete: { affectation, periode } });
}
