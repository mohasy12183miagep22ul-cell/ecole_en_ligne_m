/**
 * Clés TanStack Query : une par ressource et par portée. Le cache n'est
 * jamais persisté sur l'appareil (noms d'élèves, notes) et il est vidé à la
 * déconnexion comme à la perte de session.
 */
export const cles = {
  affectations: ['enseignant', 'affectations'] as const,
  periodes: (affectation: number) => ['enseignant', 'periodes', affectation] as const,
  types: ['enseignant', 'types'] as const,
  evaluations: (affectation: number | null) => ['enseignant', 'evaluations', affectation ?? 'toutes'] as const,
  toutesEvaluations: ['enseignant', 'evaluations'] as const,
  grille: (evaluation: number) => ['enseignant', 'grille', evaluation] as const,
  appreciations: (affectation: number, periode: number | null) =>
    ['enseignant', 'appreciations', affectation, periode ?? 'courante'] as const,
  recap: (affectation: number, periode: number | null) => ['enseignant', 'recap', affectation, periode ?? 'courante'] as const,

  validation: (etat: 'soumise' | 'validee') => ['direction', 'evaluations', etat] as const,
  toutesValidations: ['direction', 'evaluations'] as const,
  detail: (evaluation: number) => ['direction', 'detail', evaluation] as const,
  suivi: (periode: number | null, classe: number | null) => ['direction', 'suivi', periode ?? 'courante', classe ?? 'toutes'] as const,
  toutSuivi: ['direction', 'suivi'] as const,
  inscriptions: ['direction', 'inscriptions'] as const,

  enfants: ['portail', 'enfants'] as const,
  dossier: (enfant: string) => ['portail', 'dossier', enfant] as const,
};
