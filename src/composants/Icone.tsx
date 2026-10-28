import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import { couleurs, dimensions } from '@/theme/tokens';

export type IconeDef = IconDefinition;

/** Icône décorative : le libellé accessible est porté par le bouton parent. */
export function Icone({
  icone,
  taille = dimensions.icone,
  couleur = couleurs.texte,
}: {
  icone: IconDefinition;
  taille?: number;
  couleur?: string;
}) {
  return <FontAwesomeIcon icon={icone} size={taille} color={couleur} />;
}
