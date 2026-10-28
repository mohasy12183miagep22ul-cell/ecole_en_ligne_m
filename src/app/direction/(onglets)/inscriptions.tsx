import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { inscriptionsAValider, refuserInscription, validerInscription } from '@/api';
import type { DossierInscription, InscriptionsAValider } from '@/api/types';
import { Alerte } from '@/composants/Alerte';
import { Avatar } from '@/composants/Avatar';
import { Bouton } from '@/composants/Bouton';
import { Carte } from '@/composants/Carte';
import { ChampMotif, verifierMotif } from '@/composants/ChampMotif';
import { Chargement, ErreurChargement, EtatVide } from '@/composants/EtatVide';
import { Feuille } from '@/composants/Feuille';
import { Icone } from '@/composants/Icone';
import { faCheck, faFolderOpen, faTriangleExclamation, faUserCheck, faXmark } from '@/composants/icones';
import { Pastille } from '@/composants/Pastille';
import { Puces } from '@/composants/Selecteurs';
import { Texte } from '@/composants/Texte';
import { useToast } from '@/composants/Toast';
import { cles } from '@/requetes/cles';
import { useAccent } from '@/theme/accent';
import { couleurs, dimensions, espaces, rayons } from '@/theme/tokens';
import { dateCourte, initiales, paireAvatar, pluriel } from '@/utils/format';

type Classe = InscriptionsAValider['classes'][number];

/** Dossiers soumis : pièces obligatoires (RG6), capacité des classes (RG7), unicité (RG5, RG8). */
export default function Inscriptions() {
  const { acc } = useAccent();
  const client = useQueryClient();
  const toast = useToast();
  const [aValider, setAValider] = useState<DossierInscription | null>(null);
  const [aRefuser, setARefuser] = useState<DossierInscription | null>(null);
  const [classeId, setClasseId] = useState<number | null>(null);
  const [forcer, setForcer] = useState(false);
  const [motif, setMotif] = useState('');

  const liste = useInfiniteQuery({
    queryKey: cles.inscriptions,
    queryFn: ({ pageParam }) => inscriptionsAValider(pageParam),
    initialPageParam: 1,
    getNextPageParam: (r) => (r.pagination.page < r.pagination.dernierePage ? r.pagination.page + 1 : undefined),
  });

  const dossiers = liste.data?.pages.flatMap((p) => p.dossiers) ?? [];
  const classes = liste.data?.pages[0]?.classes ?? [];
  const total = liste.data?.pages[0]?.pagination.total ?? 0;
  const classesDuNiveau = aValider ? classes.filter((c) => c.niveauId === aValider.niveauId) : [];
  const classe = classesDuNiveau.find((c) => c.id === classeId) ?? null;
  const pleine = !!classe && classe.effectif >= classe.capacite;

  const ouvrirValidation = (d: DossierInscription) => {
    setClasseId(d.classeId);
    setForcer(false);
    setMotif('');
    setAValider(d);
  };

  return (
    <View style={styles.page}>
      <FlatList
        data={dossiers}
        keyExtractor={(d) => String(d.id)}
        contentContainerStyle={styles.contenu}
        ListHeaderComponent={
          total ? (
            <Texte taille="s" couleur={couleurs.texteSecondaire}>
              {`${pluriel(total, 'dossier soumis', 'dossiers soumis')} à examiner`}
            </Texte>
          ) : undefined
        }
        renderItem={({ item }) => (
          <CarteDossier
            dossier={item}
            onValider={() => ouvrirValidation(item)}
            onRefuser={() => {
              setMotif('');
              setARefuser(item);
            }}
          />
        )}
        ListEmptyComponent={
          liste.isPending ? (
            <Chargement />
          ) : liste.error ? (
            <ErreurChargement erreur={liste.error} reessayer={liste.refetch} />
          ) : (
            <EtatVide icone={faFolderOpen} titre="Aucun dossier à valider" texte="Les dossiers soumis par le secrétariat apparaîtront ici." />
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
        visible={aValider !== null}
        titre="Valider l’inscription ?"
        texte={aValider ? `${aValider.nom} ${aValider.prenoms} · ${aValider.niveau}. Choisissez la classe d’affectation.` : undefined}
        confirmer="Valider"
        verifier={() => {
          if (!classe) return 'Choisissez une classe.';
          if (pleine && !forcer) return 'La classe est pleine (RG7) : choisissez-en une autre ou dépassez la capacité avec un motif.';
          if (pleine && forcer) return verifierMotif(motif);
          return null;
        }}
        onConfirmer={async () => {
          if (!aValider || !classe) return;
          await validerInscription(aValider.id, {
            classeId: classe.id,
            forcer: pleine && forcer,
            motifDepassement: pleine && forcer ? motif.trim() : undefined,
          });
          client.invalidateQueries({ queryKey: cles.inscriptions });
          toast('Inscription validée');
        }}
        onFermer={() => setAValider(null)}>
        {aValider?.manquantes.length ? (
          <Alerte ton="erreur">{`Pièces obligatoires manquantes (RG6) : ${aValider.manquantes.join(', ')}. Le serveur refusera la validation.`}</Alerte>
        ) : null}
        {classesDuNiveau.length ? (
          <Puces
            options={classesDuNiveau.map((c: Classe) => ({
              cle: c.id,
              libelle: `${c.libelle} · ${c.effectif}/${c.capacite}`,
              icone: c.effectif >= c.capacite ? faTriangleExclamation : undefined,
            }))}
            valeur={classeId}
            onChange={(id) => {
              setClasseId(id);
              setForcer(false);
            }}
            plein={false}
            defilant={false}
            libelleGroupe="Classe d’affectation"
          />
        ) : (
          <Alerte ton="attention">{`Aucune classe ouverte pour le niveau ${aValider?.niveau ?? ''}.`}</Alerte>
        )}
        {pleine ? (
          <>
            <Pressable
              onPress={() => setForcer((f) => !f)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: forcer }}
              style={styles.case}>
              <View style={[styles.boite, forcer && { backgroundColor: acc, borderColor: acc }]}>
                {forcer ? <Icone icone={faCheck} taille={12} couleur={couleurs.blanc} /> : null}
              </View>
              <Texte taille="m" style={styles.flex}>
                {`Dépasser la capacité de ${classe?.libelle} (${classe?.effectif}/${classe?.capacite})`}
              </Texte>
            </Pressable>
            {forcer ? <ChampMotif valeur={motif} onChange={setMotif} libelle="Motif du dépassement (journalisé)" /> : null}
          </>
        ) : null}
      </Feuille>

      <Feuille
        visible={aRefuser !== null}
        titre="Refuser l’inscription ?"
        texte={aRefuser ? `${aRefuser.nom} ${aRefuser.prenoms} · ${aRefuser.niveau}` : undefined}
        confirmer="Refuser"
        danger
        verifier={() => verifierMotif(motif)}
        onConfirmer={async () => {
          if (!aRefuser) return;
          await refuserInscription(aRefuser.id, motif.trim());
          client.invalidateQueries({ queryKey: cles.inscriptions });
          toast('Inscription refusée');
        }}
        onFermer={() => setARefuser(null)}>
        <ChampMotif valeur={motif} onChange={setMotif} />
      </Feuille>
    </View>
  );
}

function CarteDossier({
  dossier: d,
  onValider,
  onRefuser,
}: {
  dossier: DossierInscription;
  onValider: () => void;
  onRefuser: () => void;
}) {
  const [fond, texte] = paireAvatar(d.eleveId);
  return (
    <Carte>
      <View style={styles.ligne}>
        <Avatar initiales={initiales(d.nom, d.prenoms)} fond={fond} texte={texte} taille={38} />
        <View style={styles.flex}>
          <Texte taille="base" graisse={700}>{`${d.nom} ${d.prenoms}`}</Texte>
          <Texte taille="s" couleur={couleurs.texteSecondaire}>
            {`${d.matricule} · ${d.niveau}${d.classe ? ` · ${d.classe}` : ''} · ${d.sexe === 'F' ? 'Fille' : 'Garçon'}`}
          </Texte>
          <Texte taille="s" couleur={couleurs.texteSecondaire}>
            {`Déposé le ${dateCourte(d.date)} · il y a ${pluriel(d.depuis, 'jour')}${d.origine ? ` · vient de ${d.origine}` : ''}`}
          </Texte>
        </View>
      </View>
      {d.redoublant || d.manquantes.length ? (
        <View style={styles.pastilles}>
          {d.redoublant ? <Pastille libelle="Redoublant" fond={couleurs.attentionFond} texte={couleurs.attentionTexte} petite /> : null}
          {d.manquantes.map((m) => (
            <Pastille key={m} libelle={m} fond={couleurs.erreurFond} texte={couleurs.erreurTexte} icone={faTriangleExclamation} petite />
          ))}
        </View>
      ) : null}
      <View style={styles.actions}>
        <Bouton libelle="Refuser" variante="dangerContour" icone={faXmark} hauteur={dimensions.cible} onPress={onRefuser} style={styles.flex} />
        <Bouton libelle="Valider" icone={faUserCheck} hauteur={dimensions.cible} onPress={onValider} style={styles.flex} />
      </View>
    </Carte>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fondPage },
  contenu: { padding: espaces.page, gap: espaces.xxl },
  ligne: { flexDirection: 'row', alignItems: 'flex-start', gap: espaces.xl },
  flex: { flex: 1 },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.s },
  actions: { flexDirection: 'row', gap: espaces.l },
  case: { flexDirection: 'row', alignItems: 'center', gap: espaces.xl, minHeight: dimensions.cible },
  boite: {
    width: 24,
    height: 24,
    borderRadius: rayons.petit - 2,
    borderWidth: 1.5,
    borderColor: couleurs.bordureCase,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
