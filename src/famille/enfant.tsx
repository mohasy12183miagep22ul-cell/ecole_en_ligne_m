import { useQuery } from '@tanstack/react-query';
import { createContext, use, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { mesEnfants } from '@/api';
import type { Enfant } from '@/api/types';
import { Avatar } from '@/composants/Avatar';
import { Texte } from '@/composants/Texte';
import { cles } from '@/requetes/cles';
import { useAccent } from '@/theme/accent';
import { couleurs, dimensions, espaces, rayons } from '@/theme/tokens';
import { initiales } from '@/utils/format';

type Contexte = {
  requete: ReturnType<typeof useEnfantsRequete>;
  enfant: Enfant | null;
  choisir: (id: string) => void;
};

const EnfantContexte = createContext<Contexte | null>(null);

function useEnfantsRequete() {
  return useQuery({ queryKey: cles.enfants, queryFn: mesEnfants });
}

/**
 * Enfant affiché, partagé entre les onglets du portail. L'identifiant est
 * opaque : il vit en mémoire le temps de la session, jamais sur l'appareil.
 */
export function FournisseurEnfant({ children }: { children: ReactNode }) {
  const requete = useEnfantsRequete();
  const [id, setId] = useState<string | null>(null);
  const enfants = requete.data?.enfants ?? [];
  const enfant = enfants.find((e) => e.id === id) ?? enfants[0] ?? null;
  return <EnfantContexte value={{ requete, enfant, choisir: setId }}>{children}</EnfantContexte>;
}

export function useEnfant() {
  const c = use(EnfantContexte);
  if (!c) throw new Error('useEnfant hors de FournisseurEnfant');
  return c;
}

/** Sélecteur d'enfant, affiché seulement s'il y a plusieurs rattachements. */
export function SelecteurEnfant() {
  const { requete, enfant, choisir } = useEnfant();
  const { acc, doux } = useAccent();
  const enfants = requete.data?.enfants ?? [];
  if (enfants.length < 2) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangee} accessibilityLabel="Enfant affiché">
      {enfants.map((e) => {
        const actif = e.id === enfant?.id;
        return (
          <Pressable
            key={e.id}
            onPress={() => choisir(e.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: actif }}
            accessibilityLabel={`${e.prenoms}${e.classe ? `, ${e.classe}` : ''}`}
            style={[styles.puce, { backgroundColor: actif ? doux : couleurs.blanc, borderColor: actif ? acc : couleurs.bordureCarte }]}>
            <Avatar
              initiales={initiales(e.nom, e.prenoms)}
              fond={actif ? acc : couleurs.neutreFond}
              texte={actif ? couleurs.blanc : couleurs.texteFort}
              taille={32}
            />
            <View>
              <Texte taille="base" graisse={actif ? 700 : 500}>
                {e.prenoms}
              </Texte>
              <Texte taille="xs" couleur={couleurs.texteSecondaire}>
                {e.classe ?? 'Non inscrit'}
              </Texte>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rangee: { gap: espaces.m },
  puce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaces.l,
    minHeight: dimensions.cible,
    paddingVertical: espaces.s,
    paddingLeft: espaces.s,
    paddingRight: espaces.xxl,
    borderRadius: rayons.pastille,
    borderWidth: 1,
  },
});
