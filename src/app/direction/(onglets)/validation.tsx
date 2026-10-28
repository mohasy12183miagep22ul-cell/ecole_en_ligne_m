import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { deverrouillerEvaluation, evaluationsDirection } from '@/api';
import type { EvaluationListe } from '@/api/types';
import { Bouton } from '@/composants/Bouton';
import { CarteEvaluation } from '@/composants/CarteEvaluation';
import { ChampMotif, verifierMotif } from '@/composants/ChampMotif';
import { Chargement, ErreurChargement, EtatVide } from '@/composants/EtatVide';
import { Feuille } from '@/composants/Feuille';
import { faCircleCheck, faUnlock } from '@/composants/icones';
import { Onglets } from '@/composants/Selecteurs';
import { useToast } from '@/composants/Toast';
import { cles } from '@/requetes/cles';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces } from '@/theme/tokens';

type Etat = 'soumise' | 'validee';

export default function Validation() {
  const { acc } = useAccent();
  const client = useQueryClient();
  const toast = useToast();
  const [onglet, setOnglet] = useState<Etat>('soumise');
  const [aDeverrouiller, setADeverrouiller] = useState<EvaluationListe | null>(null);
  const [motif, setMotif] = useState('');

  const liste = useInfiniteQuery({
    queryKey: cles.validation(onglet),
    queryFn: ({ pageParam }) => evaluationsDirection({ etat: onglet, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (r) => (r.pagination.page < r.pagination.dernierePage ? r.pagination.page + 1 : undefined),
  });

  const evaluations = liste.data?.pages.flatMap((p) => p.evaluations) ?? [];
  const compteurs = liste.data?.pages[0]?.compteurs;

  return (
    <View style={styles.page}>
      <FlatList
        data={evaluations}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={styles.contenu}
        ListHeaderComponent={
          <Onglets<Etat>
            options={[
              { cle: 'soumise', libelle: 'À valider', compteur: compteurs?.aValider },
              { cle: 'validee', libelle: 'Validées', compteur: compteurs?.validees },
            ]}
            valeur={onglet}
            onChange={setOnglet}
          />
        }
        renderItem={({ item }) => (
          <CarteEvaluation evaluation={item} direction onPress={() => router.push(`/direction/evaluation/${item.id}`)}>
            <View style={styles.actions}>
              {item.etat === 'soumise' ? (
                <Bouton
                  libelle="Examiner et valider"
                  hauteur={44}
                  onPress={() => router.push(`/direction/evaluation/${item.id}`)}
                />
              ) : (
                <Bouton
                  libelle="Déverrouiller"
                  variante="neutre"
                  icone={faUnlock}
                  hauteur={44}
                  onPress={() => {
                    setMotif('');
                    setADeverrouiller(item);
                  }}
                />
              )}
            </View>
          </CarteEvaluation>
        )}
        ListEmptyComponent={
          liste.isPending ? (
            <Chargement />
          ) : liste.error ? (
            <ErreurChargement erreur={liste.error} reessayer={liste.refetch} />
          ) : (
            <EtatVide
              icone={faCircleCheck}
              titre={onglet === 'soumise' ? 'Aucune évaluation à valider' : 'Aucune évaluation validée'}
              texte={onglet === 'soumise' ? 'Les évaluations soumises par les enseignants apparaîtront ici.' : undefined}
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

      <Feuille
        visible={aDeverrouiller !== null}
        titre="Déverrouiller l’évaluation ?"
        texte="L’évaluation repasse en brouillon : l’enseignant pourra de nouveau modifier les notes. Cette action est journalisée avec son motif."
        lignes={aDeverrouiller ? [['Évaluation', `${aDeverrouiller.titre} · ${aDeverrouiller.classe}`], ['Enseignant', aDeverrouiller.enseignant]] : []}
        confirmer="Déverrouiller"
        danger
        verifier={() => verifierMotif(motif)}
        onConfirmer={async () => {
          if (!aDeverrouiller) return;
          await deverrouillerEvaluation(aDeverrouiller.id, motif.trim());
          client.invalidateQueries({ queryKey: cles.toutesValidations });
          client.invalidateQueries({ queryKey: cles.toutSuivi });
          toast('Évaluation déverrouillée');
        }}
        onFermer={() => setADeverrouiller(null)}>
        <ChampMotif valeur={motif} onChange={setMotif} placeholder="Ex. Erreur de saisie signalée par l’enseignant" />
      </Feuille>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fondPage },
  contenu: { padding: espaces.page, gap: espaces.xxl },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
