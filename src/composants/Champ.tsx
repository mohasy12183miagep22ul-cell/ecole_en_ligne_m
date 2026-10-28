import { useState, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { BoutonIcone } from '@/composants/Bouton';
import { faEye, faEyeSlash } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { useAccent } from '@/theme/accent';
import { couleurs, dimensions, espaces, polices, rayons, tailles } from '@/theme/tokens';

type Props = Omit<TextInputProps, 'style'> & {
  libelle: string;
  erreur?: string | null;
  aide?: string;
  couleurAide?: string;
  motDePasse?: boolean;
  hauteur?: number;
  grand?: boolean;
  ref?: Ref<TextInputInstance>;
};

/** Champ de saisie : 52 pt, rayon 12, bordure accent au focus, erreur sous le champ. */
export function Champ({
  libelle,
  erreur,
  aide,
  couleurAide = couleurs.texteSecondaire,
  motDePasse,
  hauteur = dimensions.champ,
  grand,
  multiline,
  ref,
  onFocus,
  onBlur,
  ...reste
}: Props) {
  const { acc } = useAccent();
  const [focus, setFocus] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.groupe}>
      <Texte taille="m" graisse={600} couleur={couleurs.texteFort}>
        {libelle}
      </Texte>
      <View style={styles.ligne}>
        <TextInput
          ref={ref}
          {...reste}
          multiline={multiline}
          accessibilityLabel={libelle}
          secureTextEntry={motDePasse && !visible}
          placeholderTextColor={couleurs.texteTertiaire}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          style={[
            styles.champ,
            multiline
              ? [styles.multiligne, { minHeight: hauteur * 1.6 }]
              : { height: grand ? hauteur + 4 : hauteur },
            grand && styles.grand,
            motDePasse && styles.avecBouton,
            focus && { borderColor: acc, backgroundColor: couleurs.blanc },
            !!erreur && { borderColor: couleurs.erreurChampBordure },
          ]}
        />
        {motDePasse && (
          <View style={styles.bouton}>
            <BoutonIcone
              icone={visible ? faEyeSlash : faEye}
              libelle={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              onPress={() => setVisible((v) => !v)}
              couleur={couleurs.texteSecondaire}
              tailleIcone={16}
            />
          </View>
        )}
      </View>
      {aide && !erreur ? (
        <Texte taille="s" couleur={couleurAide}>
          {aide}
        </Texte>
      ) : null}
      {erreur ? (
        <Texte taille="s" couleur={couleurs.erreurTexte} accessibilityRole="alert">
          {erreur}
        </Texte>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  groupe: { gap: espaces.s },
  ligne: { justifyContent: 'center' },
  champ: {
    paddingHorizontal: espaces.xxl,
    borderRadius: rayons.moyen,
    borderWidth: 1,
    borderColor: couleurs.bordureChamp,
    backgroundColor: couleurs.fondChamp,
    fontFamily: polices[400],
    fontSize: tailles.l,
    color: couleurs.texte,
  },
  multiligne: { paddingVertical: espaces.l, textAlignVertical: 'top', lineHeight: 20 },
  grand: {
    fontFamily: polices[700],
    fontSize: tailles.grand,
    letterSpacing: 8,
    textAlign: 'center',
  },
  avecBouton: { paddingRight: 52 },
  bouton: { position: 'absolute', right: espaces.xs },
});
