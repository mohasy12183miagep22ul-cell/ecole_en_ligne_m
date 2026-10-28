import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { EvaluationListe } from '@/api/types';
import { Alerte } from '@/composants/Alerte';
import { Barre } from '@/composants/Barre';
import { Carte } from '@/composants/Carte';
import { Icone } from '@/composants/Icone';
import { BadgeEtat, ETATS } from '@/composants/Pastille';
import { Texte } from '@/composants/Texte';
import { ICONES_TYPE } from '@/enseignant/commun';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces, rayons } from '@/theme/tokens';
import { dateCourte, nombre, valeurSaisie } from '@/utils/format';

/** Carte d'une évaluation : type, classe, barème, état, avancement de la saisie. */
export function CarteEvaluation({
  evaluation: e,
  onPress,
  direction,
  children,
}: {
  evaluation: EvaluationListe;
  onPress?: () => void;
  /** Vue direction : matière et enseignant au lieu de la seule classe. */
  direction?: boolean;
  children?: ReactNode;
}) {
  const { acc, doux } = useAccent();
  const s = e.statistiques;
  const faits = s.notes + s.absents;
  const meta = direction
    ? `${e.matiere} · ${e.classe} · ${e.enseignant}`
    : `${e.classe} · ${dateCourte(e.date)} · sur ${valeurSaisie(e.noteMax)} · poids ${valeurSaisie(e.poids)}`;

  return (
    <Carte
      onPress={onPress}
      accessibilityLabel={`${e.titre}, ${e.classe}, ${ETATS[e.etat]?.libelle ?? e.etat}, ${faits} sur ${s.effectif} notés`}>
      <View style={styles.haut}>
        <View style={[styles.type, { backgroundColor: doux }]}>
          <Icone icone={ICONES_TYPE[e.type]} taille={16} couleur={acc} />
        </View>
        <View style={styles.flex}>
          <Texte taille="l" graisse={700}>
            {e.titre}
          </Texte>
          <Texte taille="s" couleur={couleurs.texteSecondaire}>
            {meta}
          </Texte>
          {direction ? (
            <Texte taille="s" couleur={couleurs.texteSecondaire}>
              {`${dateCourte(e.date)} · sur ${valeurSaisie(e.noteMax)} · ${e.periode}`}
            </Texte>
          ) : null}
        </View>
        <BadgeEtat etat={e.etat} />
      </View>
      {e.motifRetour && e.etat === 'brouillon' ? (
        <Alerte ton="attention">{`Renvoyée par la direction : ${e.motifRetour}`}</Alerte>
      ) : null}
      <View style={styles.bas}>
        <Barre ratio={faits / Math.max(1, s.effectif)} />
        <Texte taille="s" graisse={600} couleur={couleurs.texteFort}>{`${faits}/${s.effectif} notés`}</Texte>
        <Texte taille="s" couleur={couleurs.texteSecondaire}>{`Moy. ${nombre(s.moyenne)}`}</Texte>
      </View>
      {children}
    </Carte>
  );
}

const styles = StyleSheet.create({
  haut: { flexDirection: 'row', alignItems: 'flex-start', gap: espaces.xl },
  type: { width: 40, height: 40, borderRadius: rayons.champ, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 3 },
  bas: { flexDirection: 'row', alignItems: 'center', gap: espaces.xl },
});
