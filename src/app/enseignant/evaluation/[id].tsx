import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  FlatList,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
  useWindowDimensions,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, grille, soumettreEvaluation } from '@/api';
import type { Grille } from '@/api/types';
import { Alerte } from '@/composants/Alerte';
import { Bouton } from '@/composants/Bouton';
import { Carte } from '@/composants/Carte';
import { Champ } from '@/composants/Champ';
import { Entete } from '@/composants/Entete';
import { Chargement, ErreurChargement } from '@/composants/EtatVide';
import { Feuille, Refus } from '@/composants/Feuille';
import { faCircleCheck, faCloud, faKeyboard, faLock, faPaperPlane, faSpinner, faTriangleExclamation } from '@/composants/icones';
import { Icone } from '@/composants/Icone';
import { BadgeEtat, Pastille } from '@/composants/Pastille';
import { Texte } from '@/composants/Texte';
import { useToast } from '@/composants/Toast';
import { controler, fusionner, statistiques, versSaisie, type Cellule } from '@/enseignant/cellules';
import { phraseSaisie } from '@/enseignant/commun';
import { LigneNote } from '@/enseignant/LigneNote';
import { abandonner, enAttente, envoyer, mettreEnFile, rejetDe, useFile } from '@/saisie/file';
import { useEnLigne } from '@/saisie/reseau';
import { cles } from '@/requetes/cles';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces, rayons } from '@/theme/tokens';
import { dateCourte, heure, nombre, pluriel, valeurSaisie } from '@/utils/format';

const ACCESSOIRE = 'grille-clavier';
const DELAI_ENVOI_MS = 700;

export default function SaisieNotes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const evaluationId = Number(id);
  // Pas de rechargement automatique : il remonterait la grille sous les doigts de l'enseignant.
  const requete = useQuery({
    queryKey: cles.grille(evaluationId),
    queryFn: () => grille(evaluationId),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const { pret } = useFile();

  let corps;
  if (requete.isPending || !pret) corps = <Chargement />;
  else if (requete.error) corps = <ErreurChargement erreur={requete.error} reessayer={requete.refetch} />;
  else corps = <GrilleSaisie key={requete.dataUpdatedAt} donnees={requete.data} rafraichir={requete.refetch} />;

  return (
    <View style={styles.page}>
      <Entete titre="Saisie des notes" retour />
      {corps}
    </View>
  );
}

type EtatEnvoi = { enCours: boolean; erreurServeur: boolean; enregistreLe: string | null };

/**
 * Grille montée une fois par version des données du serveur : l'état local
 * part des valeurs reçues, recouvertes par les saisies encore en attente.
 */
function GrilleSaisie({ donnees, rafraichir }: { donnees: Grille; rafraichir: () => Promise<unknown> }) {
  const { evaluation, lignes } = donnees;
  const evaluationId = evaluation.id;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { acc } = useAccent();
  const client = useQueryClient();
  const toast = useToast();
  const enLigne = useEnLigne();
  useFile();

  const [cellules, setCellules] = useState(() => fusionner(lignes, enAttente(evaluationId)));
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [envoi, setEnvoi] = useState<EtatEnvoi>({ enCours: false, erreurServeur: false, enregistreLe: null });
  const [observation, setObservation] = useState<{ eleveId: number; texte: string } | null>(null);
  const [soumission, setSoumission] = useState(false);
  const [clavier, setClavier] = useState(false);
  const [actif, setActif] = useState(0);

  const liste = useRef<FlatList>(null);
  const champs = useRef(new Map<number, TextInputInstance>());
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  const modifiable = evaluation.etat === 'brouillon' && donnees.saisie.ouverte;
  const stats = statistiques(cellules);
  const attente = enAttente(evaluationId).length;
  const rejet = rejetDe(evaluationId);

  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', () => setClavier(true));
    const b = Keyboard.addListener('keyboardDidHide', () => setClavier(false));
    return () => {
      a.remove();
      b.remove();
      if (minuterie.current) clearTimeout(minuterie.current);
    };
  }, []);

  const lancerEnvoi = useCallback(async () => {
    setEnvoi((e) => ({ ...e, enCours: true }));
    try {
      const r = await envoyer(evaluationId);
      setEnvoi({ enCours: false, erreurServeur: false, enregistreLe: r?.enregistreLe ?? new Date().toISOString() });
      client.invalidateQueries({ queryKey: cles.toutesEvaluations });
      client.invalidateQueries({ queryKey: cles.affectations });
    } catch (e) {
      // Hors ligne : la file reste sur l'appareil, la synchronisation la renverra.
      const serveur = e instanceof ApiError && !e.horsLigne && e.status >= 500;
      setEnvoi((x) => ({ ...x, enCours: false, erreurServeur: serveur }));
    }
  }, [client, evaluationId]);

  const planifierEnvoi = useCallback(() => {
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(lancerEnvoi, DELAI_ENVOI_MS);
  }, [lancerEnvoi]);

  // Retour du réseau pendant la saisie : on renvoie aussitôt.
  const aEnvoyer = attente > 0 && !rejet;
  useEffect(() => {
    if (enLigne && aEnvoyer) planifierEnvoi();
  }, [enLigne, aEnvoyer, planifierEnvoi]);

  const modifier = useCallback(
    (eleveId: number, cellule: Cellule) => {
      setCellules((c) => ({ ...c, [eleveId]: cellule }));
      mettreEnFile(evaluationId, versSaisie(eleveId, cellule)).then(planifierEnvoi);
    },
    [evaluationId, planifierEnvoi]
  );

  // Dernier état des cellules pour les rappels mémorisés des lignes.
  const celluleDe = useRef(cellules);
  useLayoutEffect(() => {
    celluleDe.current = cellules;
  }, [cellules]);

  const onTexte = useCallback(
    (eleveId: number, texte: string) => {
      const erreur = controler(texte, evaluation.noteMax);
      setErreurs((e) => {
        const suite = { ...e };
        if (erreur) suite[eleveId] = erreur;
        else delete suite[eleveId];
        return suite;
      });
      const cellule = { ...celluleDe.current[eleveId], texte };
      if (erreur) {
        // Refusée à la frappe : affichée pour correction, jamais envoyée.
        setCellules((c) => ({ ...c, [eleveId]: cellule }));
        return;
      }
      modifier(eleveId, cellule);
    },
    [evaluation.noteMax, modifier]
  );

  const onAbsent = useCallback(
    (eleveId: number) => {
      const c = celluleDe.current[eleveId];
      setErreurs((e) => {
        const suite = { ...e };
        delete suite[eleveId];
        return suite;
      });
      modifier(eleveId, { ...c, absent: !c.absent, texte: '' });
    },
    [modifier]
  );

  const onObservation = useCallback((eleveId: number) => {
    setObservation({ eleveId, texte: celluleDe.current[eleveId]?.observation ?? '' });
  }, []);

  const allerA = useCallback(
    (index: number) => {
      if (index < 0 || index >= lignes.length) {
        Keyboard.dismiss();
        return;
      }
      liste.current?.scrollToIndex({ index, viewPosition: 0.3, animated: true });
      const eleve = lignes[index];
      const champ = champs.current.get(eleve.id);
      if (champ) champ.focus();
      else setTimeout(() => champs.current.get(eleve.id)?.focus(), 300);
    },
    [lignes]
  );

  /** Élève suivant (ou précédent) dont la note reste à saisir : les absents sont sautés. */
  const suivant = useCallback(
    (index: number, sens: 1 | -1 = 1) => {
      let i = index + sens;
      while (i >= 0 && i < lignes.length && celluleDe.current[lignes[i].id]?.absent) i += sens;
      allerA(i);
    },
    [allerA, lignes]
  );

  const onFocus = useCallback(
    (index: number) => {
      setActif(index);
      // Le clavier ne doit jamais masquer la ligne en cours.
      liste.current?.scrollToIndex({ index, viewPosition: 0.3, animated: true });
    },
    []
  );

  const soumettre = async () => {
    if (Object.keys(erreurs).length) throw new Refus('Corrigez les notes signalées en rouge avant de soumettre.');
    if (enAttente(evaluationId).length) {
      try {
        await envoyer(evaluationId);
      } catch {
        throw new Refus('Des notes ne sont pas encore enregistrées sur le serveur. Attendez le retour du réseau puis réessayez.');
      }
    }
    await soumettreEvaluation(evaluationId);
    client.invalidateQueries({ queryKey: cles.grille(evaluationId) });
    client.invalidateQueries({ queryKey: cles.toutesEvaluations });
    client.invalidateQueries({ queryKey: cles.affectations });
    toast('Notes soumises à la direction');
  };

  const etatSauvegarde = (() => {
    if (rejet) return { fond: couleurs.erreurFond, texte: couleurs.erreurTexte, icone: faTriangleExclamation, libelle: 'Saisie refusée par le serveur' };
    if (attente && !enLigne)
      return {
        fond: couleurs.attentionFond,
        texte: couleurs.attentionTexte,
        icone: faCloud,
        libelle: `${pluriel(attente, 'modification conservée', 'modifications conservées')} sur l’appareil`,
      };
    if (attente && envoi.erreurServeur)
      return { fond: couleurs.attentionFond, texte: couleurs.attentionTexte, icone: faCloud, libelle: 'Serveur indisponible · saisie conservée' };
    if (attente || envoi.enCours) return { fond: couleurs.infoFond, texte: couleurs.infoTexte, icone: faSpinner, libelle: 'Enregistrement…' };
    return {
      fond: couleurs.succesFond,
      texte: couleurs.succesTexte,
      icone: faCircleCheck,
      libelle: envoi.enregistreLe ? `Enregistré à ${heure(envoi.enregistreLe)}` : 'Tout est enregistré',
    };
  })();

  const messageVerrou =
    evaluation.etat === 'soumise'
      ? 'Notes soumises à la direction — en attente de validation. La saisie est fermée.'
      : evaluation.etat === 'validee' || evaluation.etat === 'verrouillee'
        ? 'Évaluation validée par la direction : elle n’est plus modifiable (RG12). Seul le chef d’établissement peut la déverrouiller.'
        : `${phraseSaisie(donnees.saisie)} : les notes ne peuvent plus être modifiées (RG13). La direction peut accorder une dérogation.`;

  const entete = (
    <View style={styles.entete}>
      <Carte>
        <View style={styles.titre}>
          <View style={styles.flex}>
            <Texte taille="xl" graisse={800}>
              {evaluation.titre}
            </Texte>
            <Texte taille="s" couleur={couleurs.texteSecondaire}>
              {`${evaluation.classe} · ${evaluation.matiere} · ${dateCourte(evaluation.date)} · sur ${valeurSaisie(evaluation.noteMax)} · poids ${valeurSaisie(evaluation.poids)}`}
            </Texte>
            <Texte taille="s" couleur={couleurs.texteSecondaire}>
              {`${evaluation.typeLibelle} · ${evaluation.periode}`}
            </Texte>
          </View>
          <BadgeEtat etat={evaluation.etat} />
        </View>
        <View style={styles.pastilles}>
          <Pastille
            libelle={stats.reste === 0 ? 'Tous les élèves sont notés' : `${pluriel(stats.reste, 'élève reste', 'élèves restent')} à noter`}
            fond={stats.reste === 0 ? couleurs.succesFond : couleurs.attentionFond}
            texte={stats.reste === 0 ? couleurs.succesTexte : couleurs.attentionTexte}
          />
          {modifiable || attente ? (
            <Pastille libelle={etatSauvegarde.libelle} fond={etatSauvegarde.fond} texte={etatSauvegarde.texte} icone={etatSauvegarde.icone} />
          ) : null}
        </View>
        {evaluation.motifRetour && evaluation.etat === 'brouillon' ? (
          <Alerte ton="attention">{`Renvoyée par la direction : ${evaluation.motifRetour}`}</Alerte>
        ) : null}
        {!modifiable ? (
          <Alerte ton="neutre" icone={faLock}>
            {messageVerrou}
          </Alerte>
        ) : (
          <View style={styles.astuce}>
            <Icone icone={faKeyboard} taille={13} couleur={couleurs.texteSecondaire} />
            <Texte taille="s" couleur={couleurs.texteSecondaire} style={styles.flex}>
              « Suivant » pour l’élève suivant · enregistrement automatique, même hors ligne
            </Texte>
          </View>
        )}
        {rejet ? (
          <Alerte
            ton="erreur"
            action={
              <Bouton
                libelle="Abandonner mes saisies non envoyées"
                variante="lien"
                onPress={async () => {
                  await abandonner(evaluationId);
                  rafraichir();
                }}
              />
            }>
            {`${rejet} Vos saisies sont conservées sur l’appareil : notez-les avant de les abandonner.`}
          </Alerte>
        ) : null}
      </Carte>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={liste}
        data={lignes}
        keyExtractor={(l) => String(l.id)}
        ListHeaderComponent={entete}
        contentContainerStyle={styles.contenu}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        initialNumToRender={20}
        windowSize={11}
        renderItem={({ item, index }) => (
          <LigneNote
            index={index}
            ligne={item}
            cellule={cellules[item.id]}
            erreur={erreurs[item.id] ?? null}
            modifiable={modifiable}
            avecNumero={width >= 400}
            dernier={index === lignes.length - 1}
            champRef={(r) => {
              if (r) champs.current.set(item.id, r);
              else champs.current.delete(item.id);
            }}
            accessoireId={Platform.OS === 'ios' ? ACCESSOIRE : undefined}
            onTexte={onTexte}
            onAbsent={onAbsent}
            onObservation={onObservation}
            onSuivant={suivant}
            onFocus={onFocus}
          />
        )}
        onScrollToIndexFailed={(info) => {
          liste.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
          setTimeout(() => liste.current?.scrollToIndex({ index: info.index, viewPosition: 0.3, animated: true }), 120);
        }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              // Les saisies en attente partent d'abord : le rechargement les fusionne ensuite.
              (attente ? lancerEnvoi() : Promise.resolve()).then(rafraichir);
            }}
            tintColor={acc}
            colors={[acc]}
          />
        }
      />

      {/* Barre de synthèse fixe, au-dessus du clavier quand il est ouvert. */}
      <View style={[styles.synthese, { paddingBottom: (clavier ? 0 : insets.bottom) + espaces.xl }]}>
        <View style={styles.chiffres} accessibilityRole="summary">
          <Texte taille="s" couleur={couleurs.texteSecondaire}>
            {'Moyenne '}
            <Texte taille="l" graisse={800}>
              {nombre(stats.moyenne)}
            </Texte>
          </Texte>
          <Texte taille="s" couleur={couleurs.texteSecondaire}>
            {'Min '}
            <Texte taille="s" graisse={700}>
              {nombre(stats.min)}
            </Texte>
          </Texte>
          <Texte taille="s" couleur={couleurs.texteSecondaire}>
            {'Max '}
            <Texte taille="s" graisse={700}>
              {nombre(stats.max)}
            </Texte>
          </Texte>
          <Texte taille="s" couleur={couleurs.texteSecondaire}>
            {'Absents '}
            <Texte taille="s" graisse={700}>
              {String(stats.absents)}
            </Texte>
          </Texte>
        </View>
        {modifiable ? (
          <Bouton libelle="Soumettre" icone={faPaperPlane} hauteur={46} onPress={() => setSoumission(true)} />
        ) : null}
      </View>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={ACCESSOIRE}>
          <View style={styles.accessoire}>
            <Bouton libelle="Précédent" variante="lien" onPress={() => suivant(actif, -1)} />
            <Bouton libelle="Suivant" variante="lien" onPress={() => suivant(actif)} />
            <View style={styles.flex} />
            <Bouton libelle="OK" variante="lien" onPress={() => Keyboard.dismiss()} />
          </View>
        </InputAccessoryView>
      ) : null}

      <Feuille
        visible={observation !== null}
        titre="Observation"
        texte={
          observation
            ? (() => {
                const l = lignes.find((x) => x.id === observation.eleveId);
                return l ? `${l.nom} ${l.prenoms}` : undefined;
              })()
            : undefined
        }
        confirmer={modifiable ? 'Enregistrer' : 'Fermer'}
        onFermer={() => setObservation(null)}
        onConfirmer={() => {
          if (!modifiable || !observation) return;
          const c = celluleDe.current[observation.eleveId];
          if (c.observation !== observation.texte) modifier(observation.eleveId, { ...c, observation: observation.texte });
        }}>
        <Champ
          libelle="Observation (facultatif)"
          value={observation?.texte ?? ''}
          onChangeText={(t) => setObservation((o) => (o ? { ...o, texte: t } : o))}
          editable={modifiable}
          multiline
          maxLength={200}
          placeholder="Ex. Malade, justificatif fourni"
          autoFocus={modifiable}
        />
      </Feuille>

      <Feuille
        visible={soumission}
        titre="Soumettre les notes à la direction ?"
        texte="Après soumission, la saisie est fermée. Une fois validée par la direction, l’évaluation ne sera plus modifiable."
        lignes={[
          ['Évaluation', `${evaluation.titre} · ${evaluation.classe}`],
          ['Notés', `${stats.notes} / ${stats.effectif}`],
          ['Absents', String(stats.absents)],
          ['Sans note', String(stats.reste)],
          ['Moyenne', `${nombre(stats.moyenne)} / ${valeurSaisie(evaluation.noteMax)}`],
        ]}
        confirmer="Soumettre"
        onConfirmer={soumettre}
        onFermer={() => setSoumission(false)}>
        {stats.reste > 0 ? (
          <Alerte ton="attention">{`${pluriel(stats.reste, 'élève n’a', 'élèves n’ont')} ni note ni absence.`}</Alerte>
        ) : null}
      </Feuille>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fondPage },
  flex: { flex: 1 },
  contenu: { paddingBottom: espaces.page },
  entete: { padding: espaces.page, paddingBottom: espaces.xl },
  titre: { flexDirection: 'row', alignItems: 'flex-start', gap: espaces.xl },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.m },
  astuce: { flexDirection: 'row', alignItems: 'center', gap: espaces.m },
  synthese: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: espaces.xl,
    paddingHorizontal: espaces.page,
    paddingTop: espaces.xl,
    backgroundColor: couleurs.blanc,
    borderTopWidth: 1,
    borderTopColor: couleurs.bordureCarte,
    borderTopLeftRadius: rayons.carte,
    borderTopRightRadius: rayons.carte,
    shadowColor: couleurs.ombre,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
  },
  chiffres: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: espaces.page, rowGap: espaces.xs },
  accessoire: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaces.page,
    paddingHorizontal: espaces.page,
    backgroundColor: couleurs.fondEntete,
    borderTopWidth: 1,
    borderTopColor: couleurs.bordureCarte,
  },
});
