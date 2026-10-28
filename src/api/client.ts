import { effacerJeton, lireJeton } from '@/api/jeton';
import type { CodeErreur, ErreurChamp } from '@/api/types';

/**
 * Adresse du serveur, fixée par EXPO_PUBLIC_API_URL (fichier .env). En
 * développement sur un téléphone, ce doit être l'adresse IP du poste sur le
 * réseau local (ex. http://192.168.1.20:3333), jamais localhost.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333').replace(
  /\/+$/,
  ''
);

const DELAI_MS = 15_000;

/** Erreur renvoyée par l'API (ou réseau injoignable : statut 0, code E_RESEAU). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: CodeErreur | null = null,
    /** Règle de gestion à l'origine d'un refus 422, ex. « RG12 ». */
    readonly regle: string | null = null,
    /** Erreurs de validation, par champ. */
    readonly champs: ErreurChamp[] = [],
    readonly corps: unknown = null
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Message de l'erreur rattachée à un champ du formulaire. */
  champ(nom: string) {
    return this.champs.find((c) => c.field === nom)?.message ?? null;
  }

  get horsLigne() {
    return this.status === 0;
  }
}

type Ecouteur = (erreur: ApiError) => void;
let surSessionPerdue: Ecouteur | null = null;

/**
 * Appelé quand le serveur refuse le jeton (401 hors connexion) : expiré,
 * révoqué ou compte désactivé. Le jeton local est déjà effacé ; l'appelant
 * renvoie vers l'écran de connexion.
 */
export function quandSessionPerdue(ecouteur: Ecouteur | null) {
  surSessionPerdue = ecouteur;
}

type Options = {
  methode?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  corps?: unknown;
  requete?: Record<string, string | number | null | undefined>;
  /** Sans jeton (connexion, second facteur, mot de passe oublié). */
  anonyme?: boolean;
  signal?: AbortSignal;
};

function adresse(chemin: string, requete?: Options['requete']) {
  const params = Object.entries(requete ?? {})
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${API_URL}/api/v1${chemin}${params ? `?${params}` : ''}`;
}

function versErreur(status: number, corps: any): ApiError {
  const champs: ErreurChamp[] = Array.isArray(corps?.errors) ? corps.errors : [];
  const message =
    corps?.message ??
    champs[0]?.message ??
    (status === 401 ? 'Session expirée. Reconnectez-vous.' : `Erreur du serveur (${status}).`);
  return new ApiError(status, message, corps?.code ?? null, corps?.regle ?? null, champs, corps);
}

/** Appel JSON à l'API mobile. Lève une ApiError pour toute réponse hors 2xx. */
export async function api<T>(chemin: string, options: Options = {}): Promise<T> {
  const entetes: Record<string, string> = { Accept: 'application/json' };
  if (options.corps !== undefined) entetes['Content-Type'] = 'application/json';
  if (!options.anonyme) {
    const jeton = await lireJeton();
    if (jeton) entetes.Authorization = `Bearer ${jeton}`;
  }

  const delai = new AbortController();
  const minuterie = setTimeout(() => delai.abort(), DELAI_MS);
  options.signal?.addEventListener('abort', () => delai.abort());

  let reponse: Response;
  try {
    reponse = await fetch(adresse(chemin, options.requete), {
      method: options.methode ?? 'GET',
      headers: entetes,
      body: options.corps === undefined ? undefined : JSON.stringify(options.corps),
      signal: delai.signal,
    });
  } catch {
    throw new ApiError(0, 'Serveur injoignable. Vérifiez votre connexion.', 'E_RESEAU');
  } finally {
    clearTimeout(minuterie);
  }

  if (reponse.status === 204) return undefined as T;
  const corps = await reponse.json().catch(() => null);
  if (reponse.ok) return corps as T;

  const erreur = versErreur(reponse.status, corps);
  if (reponse.status === 401 && !options.anonyme) {
    await effacerJeton();
    surSessionPerdue?.(erreur);
  }
  throw erreur;
}
