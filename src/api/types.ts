/**
 * Contrats de l'API mobile d'École en ligne (/api/v1).
 * Référence : docs/api.md. Dates au format ISO (`AAAA-MM-JJ`), horodatages
 * ISO 8601. Les moyennes ne sont jamais arrondies par le serveur (RG15) :
 * l'arrondi à deux décimales se fait à l'affichage.
 */

export type Role =
  | 'admin'
  | 'direction'
  | 'secretariat'
  | 'enseignant'
  | 'professeur_principal'
  | 'tuteur'
  | 'eleve';

/** Espaces ouverts dans l'application, par ordre de priorité. */
export type Espace = 'direction' | 'enseignant' | 'portail';

export type Utilisateur = {
  id: number;
  fullName: string | null;
  email: string;
  initials: string;
  sousTitre: string | null;
  roles: Role[];
  espaces: Espace[];
  doitChangerMotDePasse: boolean;
};

export type Annee = { id: number; libelle: string; dateDebut: string; dateFin: string };

export type Pagination = { page: number; dernierePage: number; total: number };

// ─── Authentification ─────────────────────────────────────────────────────

export type Jeton = { type: 'bearer'; jeton: string; expireLe: string | null };

export type ConnexionReussie = { statut: 'connecte'; jeton: Jeton; utilisateur: Utilisateur };

export type DoubleFacteurRequis = {
  statut: 'double_facteur';
  /** Identifiant opaque du défi, à renvoyer avec le code. */
  defi: string;
  email: string;
  /** Rempli seulement en développement, quand aucun courriel ne part. */
  codeDeveloppement: string | null;
};

export type ReponseConnexion = ConnexionReussie | DoubleFacteurRequis;

export type Moi = { utilisateur: Utilisateur; anneeActive: Annee | null };

// ─── Enseignant ───────────────────────────────────────────────────────────

export type TypeEvaluation = 'interrogation' | 'devoir' | 'composition' | 'tp' | 'oral';
export type EtatEvaluation = 'brouillon' | 'soumise' | 'validee' | 'verrouillee';

/** Fenêtre de saisie d'une affectation sur une période (RG13). */
export type Saisie =
  | { ouverte: true; jusquAu: string; derogation: boolean }
  | { ouverte: false; jusquAu: null; derogation: false; raison: 'a_venir' | 'close' | string };

export type PeriodeResume = {
  id: number;
  libelle: string;
  debutSaisie: string;
  finSaisie: string;
};

export type CarteAffectation = {
  id: number;
  classe: string;
  niveau: string;
  matiere: string;
  noteMaxDefaut: number;
  effectif: number;
  evaluations: number;
  professeurPrincipal: boolean;
  saisie: Saisie | null;
  enCours: { id: number; titre: string; faits: number; effectif: number } | null;
};

export type MesAffectations = {
  annee: Annee | null;
  periode: PeriodeResume | null;
  affectations: CarteAffectation[];
};

export type PeriodeAffectation = PeriodeResume & { courante: boolean; saisie: Saisie };

/** Statistiques d'une évaluation, dans son barème (pas ramenées sur 20). */
export type StatistiquesEvaluation = {
  moyenne: number | null;
  min: number | null;
  max: number | null;
  /** Notes saisies (absents exclus). */
  notes: number;
  absents: number;
  /** Élèves sans note ni absence. */
  reste: number;
  effectif: number;
};

export type EvaluationListe = {
  id: number;
  titre: string;
  type: TypeEvaluation;
  date: string;
  noteMax: number;
  poids: number;
  etat: EtatEvaluation;
  motifRetour: string | null;
  affectationId: number;
  classe: string;
  matiere: string;
  enseignant: string;
  periode: string;
  statistiques: StatistiquesEvaluation;
};

export type Evaluation = {
  id: number;
  titre: string;
  type: TypeEvaluation;
  typeLibelle: string;
  date: string;
  noteMax: number;
  poids: number;
  etat: EtatEvaluation;
  motifRetour: string | null;
  affectationId: number;
  classe: string;
  matiere: string;
  periodeId: number;
  periode: string;
};

export type LigneGrille = {
  id: number;
  matricule: string;
  nom: string;
  prenoms: string;
  valeur: number | null;
  absent: boolean;
  observation: string;
};

export type Grille = {
  evaluation: Evaluation;
  saisie: Saisie;
  lignes: LigneGrille[];
  statistiques: StatistiquesEvaluation;
};

export type NouvelleEvaluation = {
  affectationId: number;
  periodeId: number;
  type: TypeEvaluation;
  titre: string;
  /** AAAA-MM-JJ */
  date: string;
  noteMax: number;
  poids: number;
};

export type ModificationEvaluation = Omit<NouvelleEvaluation, 'affectationId' | 'periodeId'>;

/** Une saisie de la grille. Un absent n'a pas de note (RG11) ; 0 est une vraie note. */
export type SaisieNote = {
  eleveId: number;
  valeur: number | null;
  absent: boolean;
  observation?: string | null;
};

export type ResultatSaisies = {
  modifiees: number;
  enregistreLe: string;
  statistiques: StatistiquesEvaluation;
};

export type Appreciations = {
  periode: { id: number; libelle: string } | null;
  eleves: { id: number; nom: string; prenoms: string; texte: string; moyenne: number | null }[];
};

export type Recapitulatif = {
  periode: { id: number; libelle: string } | null;
  synthese: {
    classe: string;
    matiere: string;
    effectif: number;
    moyenne: number | null;
    min: number | null;
    max: number | null;
    reussite: number | null;
  } | null;
  eleves: {
    id: number;
    nom: string;
    prenoms: string;
    moyenne: number | null;
    rang: number | null;
  }[];
};

// ─── Direction ────────────────────────────────────────────────────────────

export type EvaluationsAValider = {
  compteurs: { aValider: number; validees: number };
  evaluations: EvaluationListe[];
  pagination: Pagination;
};

export type DetailEvaluation = {
  evaluation: Omit<Evaluation, 'typeLibelle' | 'affectationId' | 'periodeId'> & {
    enseignant: string | null;
  };
  lignes: LigneGrille[];
  statistiques: StatistiquesEvaluation;
};

export type EtatChange = { evaluation: { id: number; titre: string; etat: EtatEvaluation } };

export type Suivi = {
  periodes: { id: number; libelle: string }[];
  periode: PeriodeResume | null;
  classes: { id: number; libelle: string }[];
  lignes: {
    affectationId: number;
    classe: string;
    matiere: string;
    enseignant: string;
    brouillons: number;
    soumises: number;
    validees: number;
    derogationJusquAu: string | null;
  }[];
};

export type DossierInscription = {
  id: number;
  eleveId: number;
  matricule: string;
  nom: string;
  prenoms: string;
  sexe: 'F' | 'M';
  niveauId: number;
  niveau: string;
  classeId: number | null;
  classe: string | null;
  etat: 'brouillon' | 'soumis' | 'valide' | 'refuse' | 'annule';
  redoublant: boolean;
  origine: string | null;
  date: string;
  /** Jours écoulés depuis le dépôt du dossier. */
  depuis: number;
  /** Libellés des pièces obligatoires manquantes (RG6). */
  manquantes: string[];
};

export type InscriptionsAValider = {
  /** Classes de l'année avec effectif du jour et capacité (RG7). */
  classes: {
    id: number;
    libelle: string;
    niveauId: number;
    capacite: number;
    effectif: number;
  }[];
  dossiers: DossierInscription[];
  pagination: Pagination;
};

// ─── Portail famille ──────────────────────────────────────────────────────

export type Enfant = {
  /** Identifiant opaque : à repasser tel quel, jamais à interpréter. */
  id: string;
  matricule: string;
  nom: string;
  prenoms: string;
  sexe: 'F' | 'M';
  classe: string | null;
  niveau: string | null;
};

export type DossierEnfant = Omit<Enfant, 'classe' | 'niveau'> & {
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string | null;
  statut: 'inscrit' | 'transfere' | 'abandon' | 'diplome' | 'exclu';
  scolarite: { annee: string; niveau: string | null; classe: string | null } | null;
  tuteurs: { nom: string; lienParente: string; principal: boolean }[];
};

// ─── Erreurs ──────────────────────────────────────────────────────────────

export type ErreurChamp = { field: string; message: string; rule: string };

export type CodeErreur =
  | 'E_IDENTIFIANTS'
  | 'E_COMPTE_VERROUILLE'
  | 'E_COMPTE_DESACTIVE'
  | 'E_CODE_INCORRECT'
  | 'E_DEFI_EXPIRE'
  | 'E_MOT_DE_PASSE_A_CHANGER'
  | 'E_ROLE'
  | 'E_INTROUVABLE'
  | 'E_ROUTE_INTROUVABLE'
  | 'E_RESEAU'
  | (string & {});
