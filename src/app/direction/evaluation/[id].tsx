import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deverrouillerEvaluation, detailEvaluation, renvoyerEvaluation, validerEvaluation } from '@/api';
import { Avatar } from '@/composants/Avatar';
import { Bouton } from '@/composants/Bouton';
import { Carte } from '@/composants/Carte';
import { ChampMotif, verifierMotif } from '@/composants/ChampMotif';
import { Ecran } from '@/composants/Ecran';
import { Entete } from '@/composants/Entete';
import { Chargement, ErreurChargement } from '@/composants/EtatVide';
import { Feuille } from '@/composants/Feuille';
import { faCircleCheck, faRotateRight, faUnlock } from '@/composants/icones';
import { BadgeEtat } from '@/composants/Pastille';
import { Texte } from '@/composants/Texte';
import { useToast } from '@/composants/Toast';
import { cles } from '@/requetes/cles';
import { couleurs, espaces, rayons } from '@/theme/tokens';
import { dateCourte, initiales, nombre, paireAvatar, valeurSaisie } from '@/utils/format';

type Action = 'valider' | 'renvoyer' | 'deverrouiller' | null;

/** Évaluation en lecture pour la direction, avec valider / renvoyer / déverrouiller. */
export default function DetailEvaluation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const evaluationId = Number(id);
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const toast = useToast();
  const requete = useQuery({ queryKey: cles.detail(evaluationId), queryFn: () => detailEvaluation(evaluationId) });
  const [action, setAction] = useState<Action>(null);
  const [motif, setMotif] = useState('');

  const ouvrir = (a: Action) => {
    setMotif('');
    setAction(a);
  };

  const apres = (message: string) => {
    client.invalidateQueries({ queryKey: cles.detail(evaluationId) });
    client.invalidateQueries({ queryKey: cles.toutesValidations });
    client.invalidateQueries({ queryKey: cles.toutSuivi });
    toast(message);
  };

  if (requete.isPending || requete.error) {
    return (
      <View style={styles.page}>
        <Entete titre="Évaluation" retour />
        {requete.isPending ? <Chargement /> : <ErreurChargement erreur={requete.error} reessayer={requete.refetch} />}
      </View>
    );
  }

  const { evaluation: e, lignes, statistiques: s } = requete.data;
  const resume: [string, string][] = [
    ['Classe · matière', `${e.classe} · ${e.matiere}`],
    ['Enseignant', e.enseignant ?? '—'],
    ['Notés', `${s.notes} / ${s.effectif}`],
    ['Absents', String(s.absents)],
    ['Sans note', String(s.reste)],
    ['Moyenne · min · max', `${nombre(s.moyenne)} · ${nombre(s.min)} · ${nombre(s.max)} (/${valeurSaisie(e.noteMax)})`],
  ];

  return (
    <View style={styles.page}>
      <Entete titre="Évaluation" retour />
      <Ecran rafraichir={requete.refetch}>
        <Carte>
          <View style={styles.titre}>
            <View style={styles.flex}>
              <Texte taille="xl" graisse={800}>
                {e.titre}
              </Texte>
              <Texte taille="s" couleur={couleurs.texteSecondaire}>
                {`${e.matiere} · ${e.classe} · ${e.enseignant ?? '—'}`}
              </Texte>
              <Texte taille="s" couleur={couleurs.texteSecondaire}>
                {`${dateCourte(e.date)} · sur ${valeurSaisie(e.noteMax)} · poids ${valeurSaisie(e.poids)} · ${e.periode}`}
              </Texte>
            </View>
            <BadgeEtat etat={e.etat} />
          </View>
          <View style={styles.chiffres}>
            {[
              ['Moyenne', nombre(s.moyenne)],
              ['Min', nombre(s.min)],
              ['Max', nombre(s.max)],
              ['Absents', String(s.absents)],
            ].map(([k, v]) => (
              <View key={k} style={styles.chiffre}>
                <Texte taille="xs" couleur={couleurs.texteSecondaire}>
                  {k}
                </Texte>
                <Texte taille="xl" graisse={800}>
                  {v}
                </Texte>
              </View>
            ))}
          </View>
          <Texte taille="s" couleur={couleurs.texteSecondaire}>{`${s.notes} notés sur ${s.effectif} · ${s.reste} sans note · barème /${valeurSaisie(e.noteMax)}`}</Texte>
        </Carte>

        <View style={styles.liste}>
          {lignes.map((l) => {
            const [fond, texte] = paireAvatar(l.id);
            return (
              <View key={l.id} style={styles.ligne} accessible accessibilityLabel={`${l.nom} ${l.prenoms}, ${l.absent ? 'absent' : `${valeurSaisie(l.valeur) || 'sans note'}`}`}>
                <Avatar initiales={initiales(l.nom, l.prenoms)} fond={fond} texte={texte} />
                <View style={styles.flex}>
                  <Texte taille="base" numberOfLines={1}>
                    <Texte taille="base" graisse={700}>
                      {l.nom}
                    </Texte>{' '}
                    {l.prenoms}
                  </Texte>
                  {l.observation ? (
                    <Texte taille="s" italique couleur={couleurs.texteSecondaire} numberOfLines={2}>
                      {l.observation}
                    </Texte>
                  ) : null}
                </View>
                <Texte taille="l" graisse={700} couleur={l.absent || l.valeur === null ? couleurs.texteTertiaire : couleurs.texte}>
                  {l.absent ? 'ABS' : l.valeur === null ? '—' : valeurSaisie(l.valeur)}
                </Texte>
              </View>
            );
          })}
        </View>
      </Ecran>

      {e.etat === 'soumise' || e.etat === 'validee' ? (
        <View style={[styles.barre, { paddingBottom: insets.bottom + espaces.xl }]}>
          {e.etat === 'soumise' ? (
            <>
              <Bouton libelle="Renvoyer" variante="neutre" icone={faRotateRight} hauteur={46} onPress={() => ouvrir('renvoyer')} style={styles.flex} />
              <Bouton libelle="Valider" icone={faCircleCheck} hauteur={46} onPress={() => ouvrir('valider')} style={styles.flex} />
            </>
          ) : (
            <Bouton libelle="Déverrouiller" variante="neutre" icone={faUnlock} hauteur={46} onPress={() => ouvrir('deverrouiller')} style={styles.flex} />
          )}
        </View>
      ) : null}

      <Feuille
        visible={action === 'valider'}
        titre={`Valider « ${e.titre} » ?`}
        texte="Après validation, l’enseignant ne pourra plus modifier les notes. Le déverrouillage reste possible et sera journalisé."
        lignes={resume}
        confirmer="Valider"
        onConfirmer={async () => {
          await validerEvaluation(evaluationId);
          apres('Évaluation validée');
        }}
        onFermer={() => setAction(null)}
      />
      <Feuille
        visible={action === 'renvoyer'}
        titre="Renvoyer à l’enseignant ?"
        texte="L’évaluation repasse en brouillon. L’enseignant verra votre motif et pourra corriger les notes avant de la soumettre de nouveau."
        confirmer="Renvoyer"
        verifier={() => verifierMotif(motif)}
        onConfirmer={async () => {
          await renvoyerEvaluation(evaluationId, motif.trim());
          apres('Évaluation renvoyée à l’enseignant');
        }}
        onFermer={() => setAction(null)}>
        <ChampMotif valeur={motif} onChange={setMotif} libelle="Motif (visible par l’enseignant)" placeholder="Ex. Trois copies sans note" />
      </Feuille>
      <Feuille
        visible={action === 'deverrouiller'}
        titre="Déverrouiller l’évaluation ?"
        texte="L’évaluation repasse en brouillon : l’enseignant pourra de nouveau modifier les notes. Cette action est journalisée avec son motif."
        confirmer="Déverrouiller"
        danger
        verifier={() => verifierMotif(motif)}
        onConfirmer={async () => {
          await deverrouillerEvaluation(evaluationId, motif.trim());
          apres('Évaluation déverrouillée');
        }}
        onFermer={() => setAction(null)}>
        <ChampMotif valeur={motif} onChange={setMotif} />
      </Feuille>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fondPage },
  flex: { flex: 1 },
  titre: { flexDirection: 'row', alignItems: 'flex-start', gap: espaces.xl },
  chiffres: { flexDirection: 'row', gap: espaces.m },
  chiffre: { flex: 1, padding: espaces.l, borderRadius: rayons.moyen, backgroundColor: couleurs.fondPage, gap: 2 },
  liste: {
    backgroundColor: couleurs.blanc,
    borderWidth: 1,
    borderColor: couleurs.bordureCarte,
    borderRadius: rayons.carte,
    overflow: 'hidden',
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaces.l,
    minHeight: 56,
    paddingHorizontal: espaces.xl,
    paddingVertical: espaces.m,
    borderTopWidth: 1,
    borderTopColor: couleurs.separateur,
    marginTop: -1,
  },
  barre: {
    flexDirection: 'row',
    gap: espaces.l,
    paddingHorizontal: espaces.page,
    paddingTop: espaces.xl,
    backgroundColor: couleurs.blanc,
    borderTopWidth: 1,
    borderTopColor: couleurs.bordureCarte,
  },
});
