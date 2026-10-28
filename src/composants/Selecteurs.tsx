import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icone, type IconeDef } from '@/composants/Icone';
import { Texte } from '@/composants/Texte';
import { useAccent } from '@/theme/accent';
import { couleurs, dimensions, espaces, rayons } from '@/theme/tokens';

type Option<T> = { cle: T; libelle: string; compteur?: number; icone?: IconeDef };

/** Onglets segmentés : piste grise, onglet actif blanc rayon 9. */
export function Onglets<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: Option<T>[];
  valeur: T;
  onChange: (cle: T) => void;
}) {
  const { acc } = useAccent();
  return (
    <View style={styles.piste} accessibilityRole="tablist">
      {options.map((o) => {
        const actif = o.cle === valeur;
        return (
          <Pressable
            key={o.cle}
            onPress={() => onChange(o.cle)}
            accessibilityRole="tab"
            accessibilityState={{ selected: actif }}
            accessibilityLabel={o.compteur === undefined ? o.libelle : `${o.libelle}, ${o.compteur}`}
            style={[styles.onglet, actif && styles.ongletActif]}>
            <Texte taille="m" graisse={700} couleur={actif ? couleurs.texte : couleurs.texteSecondaire} numberOfLines={1}>
              {o.libelle}
            </Texte>
            {o.compteur !== undefined && (
              <View style={[styles.compteur, { backgroundColor: actif ? acc : couleurs.pastilleInactive }]}>
                <Texte taille="xs" graisse={700} couleur={actif ? couleurs.blanc : couleurs.texteFort}>
                  {String(o.compteur)}
                </Texte>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Puces de filtre défilant horizontalement. `plein` : la puce active prend
 * l'accent (filtres) ; sinon accent doux (choix d'un enfant, d'un type).
 */
export function Puces<T extends string | number>({
  options,
  valeur,
  onChange,
  plein = true,
  defilant = true,
  libelleGroupe,
}: {
  options: Option<T>[];
  valeur: T | null;
  onChange: (cle: T) => void;
  plein?: boolean;
  defilant?: boolean;
  libelleGroupe?: string;
}) {
  const { acc, doux } = useAccent();
  const puces = options.map((o) => {
    const actif = o.cle === valeur;
    const fond = actif ? (plein ? acc : doux) : couleurs.blanc;
    const texte = actif ? (plein ? couleurs.blanc : acc) : couleurs.texteFort;
    return (
      <Pressable
        key={String(o.cle)}
        onPress={() => onChange(o.cle)}
        accessibilityRole="button"
        accessibilityState={{ selected: actif }}
        accessibilityLabel={o.libelle}
        style={[styles.puce, { backgroundColor: fond, borderColor: actif ? acc : couleurs.bordureChamp }]}>
        {o.icone && <Icone icone={o.icone} taille={12} couleur={texte} />}
        <Texte taille="m" graisse={600} couleur={texte} numberOfLines={1}>
          {o.libelle}
        </Texte>
      </Pressable>
    );
  });
  if (!defilant) {
    return (
      <View style={styles.enveloppe} accessibilityLabel={libelleGroupe}>
        {puces}
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rangee}
      accessibilityLabel={libelleGroupe}>
      {puces}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  piste: {
    flexDirection: 'row',
    gap: espaces.xs,
    padding: espaces.xs,
    borderRadius: rayons.moyen,
    backgroundColor: couleurs.pisteOnglets,
  },
  onglet: {
    flex: 1,
    minHeight: dimensions.cible,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaces.m,
    paddingHorizontal: espaces.m,
  },
  ongletActif: {
    backgroundColor: couleurs.blanc,
    shadowColor: couleurs.ombre,
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  compteur: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: espaces.s,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangee: { gap: espaces.m, paddingRight: espaces.page },
  enveloppe: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.m },
  puce: {
    minHeight: dimensions.cible,
    paddingHorizontal: espaces.xxl,
    borderRadius: rayons.champ,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaces.s,
  },
});
