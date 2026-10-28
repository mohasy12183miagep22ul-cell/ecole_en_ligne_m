import { createContext } from 'react';

import type { Accent } from '@/theme/tokens';

/** Permet à l'écran de connexion de teinter le cadre selon le profil de démonstration. */
export const AccentAuthContexte = createContext<(accent: Accent) => void>(() => {});
