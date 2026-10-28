import { createContext, use, type ReactNode } from 'react';

import { accents, type Accent } from '@/theme/tokens';

const AccentContexte = createContext<Accent>(accents.neutre);

/** Fixe l'accent d'un espace pour tous les composants qu'il contient. */
export function FournisseurAccent({ accent, children }: { accent: Accent; children: ReactNode }) {
  return <AccentContexte value={accent}>{children}</AccentContexte>;
}

export function useAccent() {
  return use(AccentContexte);
}
