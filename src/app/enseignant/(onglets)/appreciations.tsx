import { useQuery } from '@tanstack/react-query';
import { memo, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { appreciations, enregistrerAppreciation } from '@/api';
import type { Appreciations as DonneesAppreciations } from '@/api/types';
import { Avatar } from '@/composants/Avatar';
import { Carte } from '@/composants/Carte';
import { Chargement, ErreurChargement, EtatVide } from '@/composants/EtatVide';
import { messageErreur } from '@/composants/Feuille';
import { faCommentDots, faUsers } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { SelecteurAffectation, SelecteurPeriode, useAffectations, usePeriodes } from '@/enseignant/commun';
import { cles } from '@/requetes/cles';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces, polices, rayons, tailles } from '@/theme/tokens';
import { heure, initiales, nombre, paireAvatar } from '@/utils/format';

const MAX = 250;

export default function Appreciations() {
  const { acc } = useAccent();
  const affectations = useAffectations();
  const liste = affectations.data?.affectations ?? [];
  const [choix, setChoix] = useState<number | null>(null);
  const affectation = liste.find((a) => a.id === choix) ?? liste[0] ?? null;
  const [periode, setPeriode] = useState<number | null>(null);
  // Sans période connue, le serveur prend la courante.
  const periodes = usePeriodes(affectation?.id ?? null);
  const sansPeriode = !!periodes.data && periodes.data.periodes.length === 0;

  const requete = useQuery({
    queryKey: cles.appreciations(affectation?.id ?? 0, periode),
    queryFn: () => appreciations(affectation!.id, periode ?? undefined),
    enabled: !!affectation && (periode !== null || sansPeriode || !!periodes.error),
  });

  if (affectations.isPending) return <Chargement />;
  if (affectations.error) return <ErreurChargement erreur={affectations.error} reessayer={affectations.refetch} />;
  if (!affectation) {
    return (
      <View style={styles.page}>
        <View style={styles.vide}>
          <EtatVide icone={faUsers} titre="Aucune classe affectée" texte="Les appréciations se rédigent pour vos classes de l’année active." />
        </View>
      </View>
    );
  }

  const periodeId = requete.data?.periode?.id ?? null;

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={requete.data?.eleves ?? []}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={styles.contenu}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.entete}>
            {liste.length > 1 ? (
              <SelecteurAffectation
                affectations={liste}
                valeur={affectation.id}
                onChange={(id) => {
                  setChoix(id);
                  setPeriode(null);
                }}
              />
            ) : null}
            <SelecteurPeriode key={affectation.id} affectation={affectation.id} valeur={periode} onChange={setPeriode} />
            <Texte taille="s" couleur={couleurs.texteSecondaire}>
              {`${MAX} caractères maximum · enregistrement automatique · moyenne provisoire de la matière sur 20`}
            </Texte>
          </View>
        }
        renderItem={({ item }) =>
          periodeId ? (
            <LigneAppreciation key={`${affectation.id}-${periodeId}`} eleve={item} affectationId={affectation.id} periodeId={periodeId} />
          ) : null
        }
        ListEmptyComponent={
          requete.isPending ? (
            <Chargement />
          ) : requete.error ? (
            <ErreurChargement erreur={requete.error} reessayer={requete.refetch} />
          ) : (
            <EtatVide icone={faCommentDots} titre="Aucun élève" texte="Aucun élève n’est inscrit dans cette classe pour la période." />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={requete.isRefetching}
            onRefresh={() => {
              requete.refetch();
            }}
            tintColor={acc}
            colors={[acc]}
          />
        }
      />
    </KeyboardAvoidingView>
  );
}

type Eleve = DonneesAppreciations['eleves'][number];
type Etat = { type: 'repos' } | { type: 'envoi' } | { type: 'enregistre'; le: string } | { type: 'erreur'; message: string };

/** Une appréciation : enregistrée 1,2 s après la dernière frappe, et en quittant le champ. */
const LigneAppreciation = memo(function LigneAppreciation({
  eleve,
  affectationId,
  periodeId,
}: {
  eleve: Eleve;
  affectationId: number;
  periodeId: number;
}) {
  const { acc } = useAccent();
  const [texte, setTexte] = useState(eleve.texte ?? '');
  const [focus, setFocus] = useState(false);
  const [etat, setEtat] = useState<Etat>({ type: 'repos' });
  const enregistre = useRef(eleve.texte ?? '');
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fond, couleurTexte] = paireAvatar(eleve.id);

  const enregistrer = async (valeur: string) => {
    if (minuterie.current) clearTimeout(minuterie.current);
    if (valeur.trim() === enregistre.current.trim()) return;
    setEtat({ type: 'envoi' });
    try {
      const r = await enregistrerAppreciation({ affectationId, periodeId, eleveId: eleve.id, texte: valeur.trim() });
      enregistre.current = valeur;
      setEtat({ type: 'enregistre', le: r.enregistreLe });
    } catch (e) {
      setEtat({ type: 'erreur', message: messageErreur(e) });
    }
  };

  useEffect(() => () => {
    if (minuterie.current) clearTimeout(minuterie.current);
  }, []);

  const proche = texte.length >= MAX - 20;
  const statut =
    etat.type === 'envoi'
      ? { libelle: 'Enregistrement…', couleur: couleurs.infoTexte }
      : etat.type === 'enregistre'
        ? { libelle: `Enregistré à ${heure(etat.le)}`, couleur: couleurs.succesTexte }
        : etat.type === 'erreur'
          ? { libelle: etat.message, couleur: couleurs.erreurTexte }
          : null;

  return (
    <Carte style={styles.carte}>
      <View style={styles.ligne}>
        <Avatar initiales={initiales(eleve.nom, eleve.prenoms)} fond={fond} texte={couleurTexte} />
        <Texte taille="base" graisse={700} style={styles.flex} numberOfLines={1}>
          {`${eleve.nom} ${eleve.prenoms}`}
        </Texte>
        <Texte taille="base" graisse={800} accessibilityLabel={`Moyenne provisoire ${nombre(eleve.moyenne)}`}>
          {nombre(eleve.moyenne)}
        </Texte>
      </View>
      <TextInput
        value={texte}
        onChangeText={(t) => {
          setTexte(t);
          setEtat({ type: 'repos' });
          if (minuterie.current) clearTimeout(minuterie.current);
          minuterie.current = setTimeout(() => enregistrer(t), 1200);
        }}
        onFocus={() => setFocus(true)}
        onBlur={() => {
          setFocus(false);
          enregistrer(texte);
        }}
        multiline
        maxLength={MAX}
        placeholder="Appréciation de l’enseignant…"
        placeholderTextColor={couleurs.texteTertiaire}
        accessibilityLabel={`Appréciation de ${eleve.nom} ${eleve.prenoms}`}
        style={[styles.champ, focus && { borderColor: acc, backgroundColor: couleurs.blanc }]}
      />
      <View style={styles.pied}>
        {statut ? (
          <Texte
            taille="xs"
            graisse={600}
            couleur={statut.couleur}
            style={styles.flex}
            accessibilityLiveRegion="polite"
            accessibilityRole={etat.type === 'erreur' ? 'alert' : undefined}>
            {statut.libelle}
          </Texte>
        ) : (
          <View style={styles.flex} />
        )}
        <Texte taille="xs" graisse={600} couleur={proche ? couleurs.erreurTexte : couleurs.texteTertiaire}>
          {`${texte.length} / ${MAX}`}
        </Texte>
      </View>
    </Carte>
  );
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fondPage },
  vide: { padding: espaces.page },
  contenu: { padding: espaces.page, gap: espaces.xl },
  entete: { gap: espaces.xl, marginBottom: espaces.xs },
  carte: { gap: espaces.l, padding: espaces.xxl },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: espaces.l },
  flex: { flex: 1 },
  champ: {
    minHeight: 64,
    paddingHorizontal: espaces.xl,
    paddingVertical: espaces.l,
    borderRadius: rayons.champ,
    borderWidth: 1,
    borderColor: couleurs.bordureChamp,
    backgroundColor: couleurs.fondChamp,
    fontFamily: polices[400],
    fontSize: tailles.base,
    lineHeight: 20,
    color: couleurs.texte,
    textAlignVertical: 'top',
  },
  pied: { flexDirection: 'row', alignItems: 'center', gap: espaces.m },
});
