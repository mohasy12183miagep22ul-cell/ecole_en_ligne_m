import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { deconnexion, lireJeton, moi, quandSessionPerdue, ApiError } from '@/api';
import type { Annee, ConnexionReussie, Espace, Utilisateur } from '@/api/types';
import { associerUtilisateur, viderFile } from '@/saisie/file';

type Etat =
  | { statut: 'chargement' }
  | { statut: 'deconnecte'; motif: string | null; reprise?: boolean }
  | { statut: 'connecte'; utilisateur: Utilisateur; anneeActive: Annee | null; horsLigne?: boolean };

type Session = {
  etat: Etat;
  utilisateur: Utilisateur | null;
  anneeActive: Annee | null;
  /** Espace affiché, parmi `utilisateur.espaces`. */
  espace: Espace | null;
  choisirEspace: (e: Espace) => void;
  ouvrir: (reponse: ConnexionReussie) => Promise<void>;
  mettreAJour: (u: Utilisateur) => void;
  fermer: () => Promise<void>;
  /** Message affiché sur l'écran de connexion (session expirée…). */
  oublierMotif: () => void;
  /** Nouvel essai de reprise de session avec le jeton gardé (démarrage hors ligne). */
  reprendre: () => Promise<void>;
};

const SessionContexte = createContext<Session | null>(null);

/** Reprise de session : un jeton présent sur l'appareil est vérifié par /moi. */
async function verifierJeton(): Promise<Etat> {
  if (!(await lireJeton())) return { statut: 'deconnecte', motif: null };
  try {
    const r = await moi();
    await associerUtilisateur(r.utilisateur.id);
    return { statut: 'connecte', utilisateur: r.utilisateur, anneeActive: r.anneeActive };
  } catch (e) {
    // Hors ligne au démarrage : le jeton est gardé, on pourra réessayer.
    if (e instanceof ApiError && e.horsLigne) {
      return { statut: 'deconnecte', motif: 'Serveur injoignable. Vérifiez votre connexion.', reprise: true };
    }
    return { statut: 'deconnecte', motif: null };
  }
}

export function FournisseurSession({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [etat, setEtat] = useState<Etat>({ statut: 'chargement' });
  const [espace, setEspace] = useState<Espace | null>(null);

  const reprendre = useCallback(async () => setEtat(await verifierJeton()), []);

  useEffect(() => {
    verifierJeton().then(setEtat);
  }, []);

  // Un 401 sur un appel authentifié : le jeton est déjà effacé par le client.
  useEffect(() => {
    quandSessionPerdue(() => {
      client.clear();
      setEtat({ statut: 'deconnecte', motif: 'Session expirée, reconnectez-vous.' });
    });
    return () => quandSessionPerdue(null);
  }, [client]);

  const ouvrir = useCallback(async (reponse: ConnexionReussie) => {
    client.clear();
    await associerUtilisateur(reponse.utilisateur.id);
    setEspace(null);
    setEtat({ statut: 'connecte', utilisateur: reponse.utilisateur, anneeActive: null });
    // L'année active n'est pas dans la réponse de connexion.
    moi()
      .then((r) => setEtat({ statut: 'connecte', utilisateur: r.utilisateur, anneeActive: r.anneeActive }))
      .catch(() => {});
  }, [client]);

  const fermer = useCallback(async () => {
    try {
      await deconnexion();
    } catch {
      // Le jeton local est effacé quoi qu'il arrive.
    }
    // Purge complète : cache des requêtes et saisies en attente.
    client.clear();
    await viderFile();
    setEspace(null);
    setEtat({ statut: 'deconnecte', motif: null });
  }, [client]);

  const valeur = useMemo<Session>(() => {
    const utilisateur = etat.statut === 'connecte' ? etat.utilisateur : null;
    const espaces = utilisateur?.espaces ?? [];
    return {
      etat,
      utilisateur,
      anneeActive: etat.statut === 'connecte' ? etat.anneeActive : null,
      espace: espace && espaces.includes(espace) ? espace : (espaces[0] ?? null),
      choisirEspace: setEspace,
      ouvrir,
      fermer,
      mettreAJour: (u) => setEtat((e) => (e.statut === 'connecte' ? { ...e, utilisateur: u } : e)),
      oublierMotif: () => setEtat((e) => (e.statut === 'deconnecte' ? { ...e, motif: null } : e)),
      reprendre,
    };
  }, [etat, espace, ouvrir, fermer, reprendre]);

  return <SessionContexte value={valeur}>{children}</SessionContexte>;
}

export function useSession() {
  const s = use(SessionContexte);
  if (!s) throw new Error('useSession hors de FournisseurSession');
  return s;
}

/** Route d'accueil de chaque espace. */
export const ACCUEIL_ESPACE = {
  enseignant: '/enseignant/classes',
  direction: '/direction/validation',
  portail: '/famille/accueil',
} as const satisfies Record<Espace, string>;
