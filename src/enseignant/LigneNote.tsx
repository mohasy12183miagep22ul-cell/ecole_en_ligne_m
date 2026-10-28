import { memo, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';

import type { LigneGrille } from '@/api/types';
import { Avatar } from '@/composants/Avatar';
import { Icone } from '@/composants/Icone';
import { faCheck, faCircleExclamation, faComment } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import type { Cellule } from '@/enseignant/cellules';
import { useAccent } from '@/theme/accent';
import { couleurs, dimensions, espaces, polices, rayons, tailles } from '@/theme/tokens';
import { initiales, paireAvatar } from '@/utils/format';

type Props = {
  index: number;
  ligne: LigneGrille;
  cellule: Cellule;
  erreur: string | null;
  modifiable: boolean;
  avecNumero: boolean;
  dernier: boolean;
  champRef: Ref<TextInputInstance>;
  /** Barre « Précédent / Suivant » au-dessus du pavé décimal iOS, qui n'a pas de touche Entrée. */
  accessoireId?: string;
  onTexte: (eleveId: number, texte: string) => void;
  onAbsent: (eleveId: number) => void;
  onObservation: (eleveId: number) => void;
  onSuivant: (index: number) => void;
  onFocus: (index: number) => void;
};

/**
 * Ligne de la grille : numéro (masqué en largeur étroite), élève, note,
 * bascule « absent », observation. Absent est un bouton, jamais une valeur
 * tapée (RG11) : le champ note se vide et se verrouille.
 */
export const LigneNote = memo(function LigneNote({
  index,
  ligne,
  cellule,
  erreur,
  modifiable,
  avecNumero,
  dernier,
  champRef,
  accessoireId,
  onTexte,
  onAbsent,
  onObservation,
  onSuivant,
  onFocus,
}: Props) {
  const { acc, doux } = useAccent();
  const [fond, texte] = paireAvatar(ligne.id);
  const nom = `${ligne.nom} ${ligne.prenoms}`;
  const vide = cellule.texte === '' && !cellule.absent;

  return (
    <View style={styles.ligne}>
      <View style={styles.principale}>
        {avecNumero ? (
          <Texte taille="s" graisse={600} couleur={couleurs.texteTertiaire} style={styles.numero}>
            {String(index + 1)}
          </Texte>
        ) : null}
        <Avatar initiales={initiales(ligne.nom, ligne.prenoms)} fond={fond} texte={texte} />
        <View style={styles.eleve}>
          <Texte taille="base" numberOfLines={1}>
            <Texte taille="base" graisse={700}>
              {ligne.nom}
            </Texte>{' '}
            {ligne.prenoms}
          </Texte>
          {cellule.observation ? (
            <Texte taille="s" italique couleur={couleurs.texteSecondaire} numberOfLines={1}>
              {cellule.observation}
            </Texte>
          ) : null}
        </View>
        <TextInput
          ref={champRef}
          value={cellule.texte}
          onChangeText={(t) => onTexte(ligne.id, t)}
          editable={modifiable && !cellule.absent}
          placeholder={cellule.absent ? 'ABS' : '—'}
          placeholderTextColor={cellule.absent ? couleurs.texteFort : couleurs.texteTertiaire}
          keyboardType="decimal-pad"
          inputMode="decimal"
          returnKeyType={dernier ? 'done' : 'next'}
          submitBehavior={dernier ? 'blurAndSubmit' : 'submit'}
          onSubmitEditing={() => onSuivant(index)}
          onFocus={() => onFocus(index)}
          selectTextOnFocus
          inputAccessoryViewID={accessoireId}
          maxLength={6}
          accessibilityLabel={`Note de ${nom}`}
          accessibilityHint={cellule.absent ? 'Élève absent : pas de note' : undefined}
          style={[
            styles.note,
            vide && styles.noteVide,
            cellule.absent && styles.noteAbsent,
            !!erreur && styles.noteErreur,
          ]}
        />
        <Pressable
          onPress={() => onAbsent(ligne.id)}
          disabled={!modifiable}
          accessibilityRole="checkbox"
          accessibilityLabel={`Absent : ${nom}`}
          accessibilityState={{ checked: cellule.absent, disabled: !modifiable }}
          style={styles.cible}>
          <View
            style={[
              styles.case,
              cellule.absent ? { backgroundColor: acc, borderColor: acc } : null,
              !modifiable && styles.inactif,
            ]}>
            {cellule.absent ? <Icone icone={faCheck} taille={12} couleur={couleurs.blanc} /> : null}
          </View>
        </Pressable>
        <Pressable
          onPress={() => onObservation(ligne.id)}
          accessibilityRole="button"
          accessibilityLabel={cellule.observation ? `Observation de ${nom} : ${cellule.observation}` : `Ajouter une observation pour ${nom}`}
          style={({ pressed }) => [styles.cible, styles.observation, pressed && { backgroundColor: doux }]}>
          <Icone icone={faComment} taille={16} couleur={cellule.observation ? acc : couleurs.texteDesactive} />
        </Pressable>
      </View>
      {erreur ? (
        <View style={styles.erreur} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Icone icone={faCircleExclamation} taille={12} couleur={couleurs.erreurTexte} />
          <Texte taille="s" graisse={600} couleur={couleurs.erreurTexte} style={styles.flex}>
            {erreur}
          </Texte>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  ligne: {
    backgroundColor: couleurs.blanc,
    borderTopWidth: 1,
    borderTopColor: couleurs.separateur,
    paddingHorizontal: espaces.xl,
    paddingVertical: espaces.s,
  },
  principale: { flexDirection: 'row', alignItems: 'center', gap: espaces.m, minHeight: dimensions.ligneListe },
  numero: { width: 22 },
  eleve: { flex: 1, minWidth: 0 },
  note: {
    width: 72,
    height: dimensions.cible,
    borderRadius: rayons.champ,
    borderWidth: 1,
    borderColor: couleurs.pastilleInactive,
    backgroundColor: couleurs.blanc,
    textAlign: 'center',
    fontFamily: polices[700],
    fontSize: tailles.xl,
    color: couleurs.texte,
    paddingVertical: 0,
  },
  noteVide: { backgroundColor: couleurs.fondDiscret },
  noteAbsent: { backgroundColor: couleurs.neutreFond, fontSize: tailles.m },
  noteErreur: { backgroundColor: couleurs.erreurChampFond, borderColor: couleurs.erreurChampBordure },
  cible: { width: dimensions.cible, height: dimensions.cible, alignItems: 'center', justifyContent: 'center' },
  case: {
    width: 28,
    height: 28,
    borderRadius: rayons.petit,
    borderWidth: 1.5,
    borderColor: couleurs.bordureCase,
    backgroundColor: couleurs.blanc,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactif: { opacity: 0.5 },
  observation: { borderRadius: rayons.petit, marginLeft: -espaces.xs },
  erreur: { flexDirection: 'row', alignItems: 'center', gap: espaces.s, paddingBottom: espaces.s, paddingLeft: 38 },
  flex: { flex: 1 },
});
