import { StyleSheet, View } from 'react-native';

import type { EtatEvaluation } from '@/api/types';
import { Icone, type IconeDef } from '@/composants/Icone';
import { faCircleCheck, faLock, faPaperPlane, faPenToSquare } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { couleurs, espaces, rayons } from '@/theme/tokens';

/** Pastille 999, 12/700, icône à gauche. La couleur n'est jamais seule : il y a toujours un mot. */
export function Pastille({
  libelle,
  fond,
  texte,
  icone,
  petite,
}: {
  libelle: string;
  fond: string;
  texte: string;
  icone?: IconeDef;
  petite?: boolean;
}) {
  return (
    <View style={[styles.pastille, { backgroundColor: fond }, petite && styles.petite]}>
      {icone && <Icone icone={icone} taille={11} couleur={texte} />}
      <Texte taille={petite ? 'xs' : 's'} graisse={700} couleur={texte} numberOfLines={1}>
        {libelle}
      </Texte>
    </View>
  );
}

export const ETATS: Record<EtatEvaluation, { fond: string; texte: string; libelle: string; icone: IconeDef }> = {
  brouillon: { fond: couleurs.neutreFond, texte: couleurs.neutreTexte, libelle: 'Brouillon', icone: faPenToSquare },
  soumise: { fond: couleurs.attentionFond, texte: couleurs.attentionTexte, libelle: 'Soumise', icone: faPaperPlane },
  validee: { fond: couleurs.succesFond, texte: couleurs.succesTexte, libelle: 'Validée', icone: faCircleCheck },
  verrouillee: { fond: couleurs.verrouFond, texte: couleurs.verrouTexte, libelle: 'Verrouillée', icone: faLock },
};

export function BadgeEtat({ etat }: { etat: EtatEvaluation }) {
  const e = ETATS[etat] ?? ETATS.brouillon;
  return <Pastille libelle={e.libelle} fond={e.fond} texte={e.texte} icone={e.icone} />;
}

const styles = StyleSheet.create({
  pastille: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espaces.s,
    paddingHorizontal: espaces.l,
    paddingVertical: 5,
    borderRadius: rayons.pastille,
  },
  petite: { paddingHorizontal: espaces.m, paddingVertical: 3 },
});
