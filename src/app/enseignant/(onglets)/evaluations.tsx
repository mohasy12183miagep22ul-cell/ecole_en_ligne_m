import { useInfiniteQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { mesEvaluations } from '@/api';
import { BoutonFlottant } from '@/composants/BoutonFlottant';
import { CarteEvaluation } from '@/composants/CarteEvaluation';
import { Chargement, ErreurChargement, EtatVide } from '@/composants/EtatVide';
import { faClipboardList, faPlus } from '@/composants/icones';
import { SelecteurAffectation, useAffectations } from '@/enseignant/commun';
import { cles } from '@/requetes/cles';
import { useAccent } from '@/theme/accent';
import { couleurs, dimensions, espaces } from '@/theme/tokens';

export default function Evaluations() {
  const { acc } = useAccent();
  const params = useLocalSearchParams<{ affectation?: string }>();
  const affectationParam = params.affectation ? Number(params.affectation) : null;
  const [choix, setChoix] = useState<{ depuis: number | null; valeur: number | null }>({
    depuis: affectationParam,
    valeur: affectationParam,
  });
  // Un lien depuis « Mes classes » remplace le filtre en cours.
  if (choix.depuis !== affectationParam) setChoix({ depuis: affectationParam, valeur: affectationParam });
  const filtre = choix.valeur;

  const affectations = useAffectations();
  const liste = useInfiniteQuery({
    queryKey: cles.evaluations(filtre),
    queryFn: ({ pageParam }) => mesEvaluations({ affectation: filtre ?? undefined, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (r) => (r.pagination.page < r.pagination.dernierePage ? r.pagination.page + 1 : undefined),
  });

  const evaluations = liste.data?.pages.flatMap((p) => p.evaluations) ?? [];
  const peutCreer = (affectations.data?.affectations ?? []).some((a) => a.saisie?.ouverte);

  return (
    <View style={styles.page}>
      <FlatList
        data={evaluations}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={styles.contenu}
        ListHeaderComponent={
          affectations.data && affectations.data.affectations.length > 1 ? (
            <SelecteurAffectation
              affectations={affectations.data.affectations}
              valeur={filtre}
              onChange={(v) => setChoix((c) => ({ ...c, valeur: v }))}
              toutes
            />
          ) : undefined
        }
        renderItem={({ item }) => (
          <CarteEvaluation evaluation={item} onPress={() => router.push(`/enseignant/evaluation/${item.id}`)} />
        )}
        ListEmptyComponent={
          liste.isPending ? (
            <Chargement />
          ) : liste.error ? (
            <ErreurChargement erreur={liste.error} reessayer={liste.refetch} />
          ) : (
            <EtatVide
              icone={faClipboardList}
              titre="Aucune évaluation"
              texte="Créez une évaluation pour commencer la saisie des notes."
              action={
                peutCreer
                  ? { libelle: 'Nouvelle évaluation', icone: faPlus, onPress: () => nouvelle(filtre) }
                  : undefined
              }
            />
          )
        }
        ListFooterComponent={liste.isFetchingNextPage ? <ActivityIndicator color={acc} /> : undefined}
        onEndReached={() => liste.hasNextPage && !liste.isFetchingNextPage && liste.fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={liste.isRefetching && !liste.isFetchingNextPage}
            onRefresh={() => {
              liste.refetch();
            }}
            tintColor={acc}
            colors={[acc]}
          />
        }
      />
      {peutCreer ? <BoutonFlottant icone={faPlus} libelle="Nouvelle évaluation" onPress={() => nouvelle(filtre)} /> : null}
    </View>
  );
}

function nouvelle(affectation: number | null) {
  router.push({
    pathname: '/enseignant/nouvelle-evaluation',
    params: affectation ? { affectation: String(affectation) } : {},
  });
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fondPage },
  contenu: { padding: espaces.page, paddingBottom: dimensions.fab + espaces.vaste * 2, gap: espaces.xxl },
});
