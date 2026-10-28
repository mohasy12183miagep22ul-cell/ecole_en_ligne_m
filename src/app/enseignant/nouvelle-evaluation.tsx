import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { ApiError, creerEvaluation, typesEvaluation } from '@/api';
import type { TypeEvaluation } from '@/api/types';
import { Alerte } from '@/composants/Alerte';
import { Bouton } from '@/composants/Bouton';
import { Carte } from '@/composants/Carte';
import { Champ } from '@/composants/Champ';
import { Ecran } from '@/composants/Ecran';
import { Entete } from '@/composants/Entete';
import { Chargement, ErreurChargement, EtatVide } from '@/composants/EtatVide';
import { messageErreur } from '@/composants/Feuille';
import { faDoorClosed } from '@/composants/icones';
import { Puces } from '@/composants/Selecteurs';
import { Texte } from '@/composants/Texte';
import { useToast } from '@/composants/Toast';
import { ICONES_TYPE, SelecteurPeriode, nomAffectation, phraseSaisie, useAffectations, usePeriodes } from '@/enseignant/commun';
import { cles } from '@/requetes/cles';
import { couleurs, espaces } from '@/theme/tokens';
import { aujourdhui, dateValide, lireNombre } from '@/utils/format';

type Erreurs = Partial<Record<'titre' | 'date' | 'noteMax' | 'poids' | 'general', string>>;

export default function NouvelleEvaluation() {
  const params = useLocalSearchParams<{ affectation?: string }>();
  const client = useQueryClient();
  const toast = useToast();
  const affectations = useAffectations();
  const types = useQuery({ queryKey: cles.types, queryFn: typesEvaluation, staleTime: Infinity });

  const ouvertes = (affectations.data?.affectations ?? []).filter((a) => a.saisie?.ouverte);
  const [affectationId, setAffectationId] = useState<number | null>(params.affectation ? Number(params.affectation) : null);
  const affectation = ouvertes.find((a) => a.id === affectationId) ?? ouvertes[0] ?? null;

  const [periodeId, setPeriodeId] = useState<number | null>(null);
  const periodes = usePeriodes(affectation?.id ?? null);
  const periode = periodes.data?.periodes.find((p) => p.id === periodeId) ?? null;

  const [type, setType] = useState<TypeEvaluation>('devoir');
  const [titre, setTitre] = useState('');
  const [date, setDate] = useState(aujourdhui());
  const [noteMax, setNoteMax] = useState<string | null>(null);
  const [poids, setPoids] = useState('1');
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [envoi, setEnvoi] = useState(false);

  const noteMaxTexte = noteMax ?? String(affectation?.noteMaxDefaut ?? 20);

  const creer = async () => {
    if (!affectation || !periode) return;
    const e: Erreurs = {};
    const t = titre.trim();
    if (t.length < 3 || t.length > 120) e.titre = 'Le titre compte de 3 à 120 caractères.';
    if (!dateValide(date)) e.date = 'Date au format AAAA-MM-JJ, ex. 2026-11-04.';
    const max = lireNombre(noteMaxTexte);
    if (max === null || Number.isNaN(max) || !Number.isInteger(max) || max < 1 || max > 100) e.noteMax = 'Entier entre 1 et 100.';
    const p = lireNombre(poids);
    if (p === null || Number.isNaN(p) || p <= 0 || p > 100) e.poids = 'Strictement positif, 100 au plus.';
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnvoi(true);
    try {
      const r = await creerEvaluation({
        affectationId: affectation.id,
        periodeId: periode.id,
        type,
        titre: t,
        date,
        noteMax: max as number,
        poids: p as number,
      });
      client.invalidateQueries({ queryKey: cles.toutesEvaluations });
      client.invalidateQueries({ queryKey: cles.affectations });
      toast('Évaluation créée — saisissez les notes');
      router.replace(`/enseignant/evaluation/${r.evaluation.id}`);
    } catch (err) {
      setEnvoi(false);
      if (err instanceof ApiError && err.champs.length) {
        setErreurs({
          titre: err.champ('titre') ?? undefined,
          date: err.champ('date') ?? undefined,
          noteMax: err.champ('noteMax') ?? undefined,
          poids: err.champ('poids') ?? undefined,
          general: err.champs.some((c) => !['titre', 'date', 'noteMax', 'poids'].includes(c.field)) ? err.message : undefined,
        });
      } else {
        setErreurs({ general: messageErreur(err) });
      }
    }
  };

  let corps;
  if (affectations.isPending) corps = <Chargement />;
  else if (affectations.error) corps = <ErreurChargement erreur={affectations.error} reessayer={affectations.refetch} />;
  else if (!affectation) {
    corps = (
      <EtatVide
        icone={faDoorClosed}
        titre="Saisie fermée"
        texte="Aucune de vos classes n’a de fenêtre de saisie ouverte. Une évaluation ne peut être créée que pendant la saisie (RG13)."
        action={{ libelle: 'Retour', onPress: () => router.back() }}
      />
    );
  } else {
    corps = (
      <Carte style={styles.formulaire}>
        <View style={styles.groupe}>
          <Texte taille="m" graisse={600} couleur={couleurs.texteFort}>
            Classe et matière
          </Texte>
          <Puces
            options={ouvertes.map((a) => ({ cle: a.id, libelle: nomAffectation(a) }))}
            valeur={affectation.id}
            onChange={(id) => {
              setAffectationId(id);
              setPeriodeId(null);
              setNoteMax(null);
            }}
            plein={false}
            defilant={false}
            libelleGroupe="Classe et matière"
          />
        </View>

        <View style={styles.groupe}>
          <Texte taille="m" graisse={600} couleur={couleurs.texteFort}>
            Période
          </Texte>
          <SelecteurPeriode affectation={affectation.id} valeur={periodeId} onChange={setPeriodeId} />
          {periode ? (
            <Texte taille="s" graisse={600} couleur={periode.saisie.ouverte ? couleurs.succesTexte : couleurs.erreurTexte}>
              {phraseSaisie(periode.saisie)}
            </Texte>
          ) : null}
        </View>

        <View style={styles.groupe}>
          <Texte taille="m" graisse={600} couleur={couleurs.texteFort}>
            Type d’évaluation
          </Texte>
          <Puces
            options={(types.data?.types ?? []).map((t) => ({ cle: t.cle, libelle: t.libelle, icone: ICONES_TYPE[t.cle] }))}
            valeur={type}
            onChange={setType}
            plein={false}
            defilant={false}
            libelleGroupe="Type d’évaluation"
          />
        </View>

        <Champ
          libelle="Titre"
          value={titre}
          onChangeText={setTitre}
          placeholder="Ex. Devoir surveillé n°3"
          maxLength={120}
          erreur={erreurs.titre}
        />
        <Champ
          libelle="Date (AAAA-MM-JJ)"
          value={date}
          onChangeText={setDate}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          erreur={erreurs.date}
        />
        <View style={styles.rangee}>
          <View style={styles.flex}>
            <Champ
              libelle="Note maximale"
              value={noteMaxTexte}
              onChangeText={setNoteMax}
              keyboardType="number-pad"
              selectTextOnFocus
              erreur={erreurs.noteMax}
            />
          </View>
          <View style={styles.flex}>
            <Champ
              libelle="Poids"
              value={poids}
              onChangeText={setPoids}
              keyboardType="decimal-pad"
              selectTextOnFocus
              erreur={erreurs.poids}
            />
          </View>
        </View>

        {erreurs.general ? <Alerte ton="erreur">{erreurs.general}</Alerte> : null}

        <Bouton
          libelle="Créer et saisir les notes"
          onPress={creer}
          chargement={envoi}
          desactive={!periode || !periode.saisie.ouverte}
          etire
        />
        <Bouton libelle="Annuler" variante="neutre" hauteur={46} onPress={() => router.back()} etire />
      </Carte>
    );
  }

  return (
    <View style={styles.page}>
      <Entete titre="Nouvelle évaluation" retour />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Ecran>{corps}</Ecran>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fondPage },
  formulaire: { gap: espaces.section },
  groupe: { gap: espaces.m },
  rangee: { flexDirection: 'row', gap: espaces.xl },
  flex: { flex: 1 },
});
