import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icone, type IconeDef } from '@/composants/Icone';
import { Texte } from '@/composants/Texte';
import { useAccent } from '@/theme/accent';
import { couleurs, dimensions, espaces, rayons } from '@/theme/tokens';

type Variante = 'principal' | 'contour' | 'neutre' | 'danger' | 'dangerContour' | 'lien';

type Props = {
  libelle: string;
  onPress: () => void;
  variante?: Variante;
  icone?: IconeDef;
  iconeApres?: IconeDef;
  hauteur?: number;
  desactive?: boolean;
  chargement?: boolean;
  etire?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Bouton({
  libelle,
  onPress,
  variante = 'principal',
  icone,
  iconeApres,
  hauteur = dimensions.bouton,
  desactive,
  chargement,
  etire,
  style,
  accessibilityHint,
}: Props) {
  const { acc } = useAccent();
  const palette = {
    principal: { fond: acc, texte: couleurs.blanc, bordure: acc },
    contour: { fond: couleurs.blanc, texte: acc, bordure: acc },
    neutre: { fond: couleurs.blanc, texte: couleurs.texteFort, bordure: couleurs.bordureChamp },
    danger: { fond: couleurs.danger, texte: couleurs.blanc, bordure: couleurs.danger },
    dangerContour: { fond: couleurs.blanc, texte: couleurs.erreurTexte, bordure: couleurs.erreurBordure },
    lien: { fond: 'transparent', texte: acc, bordure: 'transparent' },
  }[variante];
  const inactif = desactive || chargement;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactif}
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactif, busy: !!chargement }}
      style={({ pressed }) => [
        styles.base,
        variante === 'lien'
          ? styles.lien
          : { minHeight: Math.max(hauteur, dimensions.cible), borderWidth: 1 },
        { backgroundColor: palette.fond, borderColor: palette.bordure },
        etire && styles.etire,
        pressed && styles.presse,
        inactif && styles.inactif,
        style,
      ]}>
      {chargement ? (
        <ActivityIndicator color={palette.texte} />
      ) : (
        <View style={styles.contenu}>
          {icone && <Icone icone={icone} taille={15} couleur={palette.texte} />}
          <Texte taille={variante === 'lien' ? 'm' : 'l'} graisse={700} couleur={palette.texte}>
            {libelle}
          </Texte>
          {iconeApres && <Icone icone={iconeApres} taille={15} couleur={palette.texte} />}
        </View>
      )}
    </Pressable>
  );
}

/** Bouton portant une seule icône : 44 pt de zone tactile, libellé obligatoire. */
export function BoutonIcone({
  icone,
  libelle,
  onPress,
  couleur = couleurs.texte,
  fond = 'transparent',
  bordure,
  taille = dimensions.cible,
  tailleIcone = 17,
  desactive,
}: {
  icone: IconeDef;
  libelle: string;
  onPress: () => void;
  couleur?: string;
  fond?: string;
  bordure?: string;
  taille?: number;
  tailleIcone?: number;
  desactive?: boolean;
}) {
  const marge = Math.max(0, (dimensions.cible - taille) / 2);
  return (
    <Pressable
      onPress={onPress}
      disabled={desactive}
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityState={{ disabled: !!desactive }}
      hitSlop={marge}
      style={({ pressed }) => [
        styles.icone,
        { width: taille, height: taille, backgroundColor: fond },
        bordure ? { borderWidth: 1, borderColor: bordure } : null,
        pressed && styles.presse,
        desactive && styles.inactif,
      ]}>
      <Icone icone={icone} taille={tailleIcone} couleur={couleur} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: rayons.moyen,
    paddingHorizontal: espaces.section,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lien: { minHeight: dimensions.cible, paddingHorizontal: 0, alignSelf: 'flex-start' },
  contenu: { flexDirection: 'row', alignItems: 'center', gap: espaces.l },
  etire: { alignSelf: 'stretch' },
  presse: { opacity: 0.8 },
  inactif: { opacity: 0.5 },
  icone: { alignItems: 'center', justifyContent: 'center', borderRadius: rayons.moyen },
});
