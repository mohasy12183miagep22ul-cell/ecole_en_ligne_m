import type { ReactNode } from 'react';

import type { Enfant } from '@/api/types';
import { Ecran } from '@/composants/Ecran';
import { Chargement, ErreurChargement, EtatVide } from '@/composants/EtatVide';
import { faPeopleRoof } from '@/composants/icones';
import { SelecteurEnfant, useEnfant } from '@/famille/enfant';

/** Corps commun aux onglets famille : chargement, aucun enfant rattaché, sélecteur. */
export function EcranEnfant({
  children,
  rafraichir,
}: {
  children: (enfant: Enfant) => ReactNode;
  rafraichir?: () => Promise<unknown>;
}) {
  const { requete, enfant } = useEnfant();
  if (requete.isPending) return <Chargement />;
  return (
    <Ecran sousOnglets rafraichir={async () => Promise.all([requete.refetch(), rafraichir?.()])}>
      {requete.error ? (
        <ErreurChargement erreur={requete.error} reessayer={requete.refetch} />
      ) : !enfant ? (
        <EtatVide
          icone={faPeopleRoof}
          titre="Aucun élève rattaché"
          texte="Aucun élève n’est rattaché à votre compte. Rapprochez-vous du secrétariat de l’établissement."
        />
      ) : (
        <>
          <SelecteurEnfant />
          {children(enfant)}
        </>
      )}
    </Ecran>
  );
}
