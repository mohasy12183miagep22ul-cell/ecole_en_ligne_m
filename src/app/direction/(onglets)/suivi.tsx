import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { accorderDerogation, suiviSaisies } from '@/api';
import type { Suivi as DonneesSuivi } from '@/api/types';
import { Alerte } from '@/composants/Alerte';
import { Barre } from '@/composants/Barre';
import { Bouton } from '@/composants/Bouton';
import { Carte } from '@/composants/Carte';
import { Champ } from '@/composants/Champ';
import { ChampMotif, verifierMotif } from '@/composants/ChampMotif';
import { Ecran } from '@/composants/Ecran';
import { Chargement, ErreurChargement, EtatVide } from '@/composants/EtatVide';
import { Feuille } from '@/composants/Feuille';
import { faCircleCheck, faDoorOpen, faListCheck, faPaperPlane, faPenToSquare } from '@/composants/icones';
import { Pastille } from '@/composants/Pastille';
import { Puces } from '@/composants/Selecteurs';
import { Texte } from '@/composants/Texte';
import { useToast } from '@/composants/Toast';
import { cles } from '@/requetes/cles';
import { couleurs, espaces } from '@/theme/tokens';
import { aujourdhui, dateCourte, dateValide } from '@/utils/format';

type Ligne = DonneesSuivi['lignes'][number];

/** Avancement des saisies par affectation, et dérogations à la fenêtre de saisie (RG13). */
export default function Suivi() {
  const client = useQueryClient();
  const toast = useToast();
  const [periode, setPeriode] = useState<number | null>(null);
  const [classe, setClasse] = useState<number | null>(null);
  const [cible, setCible] = useState<Ligne | null>(null);
  const [jusquAu, setJusquAu] = useState('');
  const [motif, setMotif] = useState('');

  const requete = useQuery({
    queryKey: cles.suivi(periode, classe),
    queryFn: () => suiviSaisies({ periode: periode ?? undefined, classe: classe ?? undefined }),
  });

  if (requete.isPending) return <Chargement />;
  if (requete.error) {
    return (
      <Ecran sousOnglets>
        <ErreurChargement erreur={requete.error} reessayer={requete.refetch} />
      </Ecran>
    );
  }

  const d = requete.data;
  const periodeCourante = d.periode;

  return (
    <Ecran sousOnglets rafraichir={requete.refetch}>
      {d.periodes.length > 1 ? (
        <Puces
          options={d.periodes.map((p) => ({ cle: p.id, libelle: p.libelle }))}
          valeur={periode ?? periodeCourante?.id ?? null}
          onChange={setPeriode}
          libelleGroupe="Période"
        />
      ) : null}
      {d.classes.length > 1 ? (
        <Puces
          options={[{ cle: 0, libelle: 'Toutes' }, ...d.classes.map((c) => ({ cle: c.id, libelle: c.libelle }))]}
          valeur={classe ?? 0}
          onChange={(c) => setClasse(c === 0 ? null : c)}
          libelleGroupe="Classe"
        />
      ) : null}
      {periodeCourante ? (
        <Alerte ton="neutre">{`${periodeCourante.libelle} · saisie du ${dateCourte(periodeCourante.debutSaisie)} au ${dateCourte(periodeCourante.finSaisie)}`}</Alerte>
      ) : null}

      {d.lignes.length === 0 ? (
        <EtatVide icone={faListCheck} titre="Aucune affectation" texte="Aucune classe ni matière n’est affectée pour cette sélection." />
      ) : (
        d.lignes.map((l) => {
          const total = l.brouillons + l.soumises + l.validees;
          return (
            <Carte key={l.affectationId}>
              <View style={styles.titre}>
                <View style={styles.flex}>
                  <Texte taille="l" graisse={700}>{`${l.classe} · ${l.matiere}`}</Texte>
                  <Texte taille="s" couleur={couleurs.texteSecondaire}>
                    {l.enseignant}
                  </Texte>
                </View>
                <Texte taille="m" graisse={700}>{`${l.validees}/${total}`}</Texte>
              </View>
              <View style={styles.rangee}>
                <Barre
                  ratio={total ? l.validees / total : 0}
                  couleur={total && l.validees === total ? couleurs.succesBarre : undefined}
                />
              </View>
              <View style={styles.pastilles}>
                <Pastille libelle={`${l.brouillons} brouillon${l.brouillons > 1 ? 's' : ''}`} fond={couleurs.neutreFond} texte={couleurs.neutreTexte} icone={faPenToSquare} petite />
                <Pastille libelle={`${l.soumises} soumise${l.soumises > 1 ? 's' : ''}`} fond={couleurs.attentionFond} texte={couleurs.attentionTexte} icone={faPaperPlane} petite />
                <Pastille libelle={`${l.validees} validée${l.validees > 1 ? 's' : ''}`} fond={couleurs.succesFond} texte={couleurs.succesTexte} icone={faCircleCheck} petite />
              </View>
              {l.derogationJusquAu ? (
                <Alerte ton="info" icone={faDoorOpen}>{`Dérogation en cours jusqu’au ${dateCourte(l.derogationJusquAu)}`}</Alerte>
              ) : null}
              {periodeCourante ? (
                <Bouton
                  libelle={l.derogationJusquAu ? 'Prolonger la dérogation' : 'Accorder une dérogation'}
                  variante="neutre"
                  icone={faDoorOpen}
                  hauteur={44}
                  onPress={() => {
                    setJusquAu(l.derogationJusquAu ?? aujourdhui());
                    setMotif('');
                    setCible(l);
                  }}
                  style={styles.droite}
                />
              ) : null}
            </Carte>
          );
        })
      )}

      <Feuille
        visible={cible !== null}
        titre="Rouvrir la saisie ?"
        texte={
          cible && periodeCourante
            ? `${cible.classe} · ${cible.matiere} (${cible.enseignant}) pourra saisir les notes du ${periodeCourante.libelle} jusqu’à la date choisie.`
            : undefined
        }
        confirmer="Accorder"
        verifier={() => {
          if (!dateValide(jusquAu)) return 'Date au format AAAA-MM-JJ, ex. 2026-12-27.';
          if (jusquAu < aujourdhui()) return 'La date doit être aujourd’hui ou plus tard.';
          return verifierMotif(motif);
        }}
        onConfirmer={async () => {
          if (!cible || !periodeCourante) return;
          const r = await accorderDerogation({
            affectationId: cible.affectationId,
            periodeId: periode ?? periodeCourante.id,
            jusquAu,
            motif: motif.trim(),
          });
          client.invalidateQueries({ queryKey: cles.toutSuivi });
          toast(`Saisie rouverte jusqu’au ${dateCourte(r.jusquAu)}`);
        }}
        onFermer={() => setCible(null)}>
        <Champ libelle="Jusqu’au (AAAA-MM-JJ)" value={jusquAu} onChangeText={setJusquAu} keyboardType="numbers-and-punctuation" maxLength={10} />
        <ChampMotif valeur={motif} onChange={setMotif} placeholder="Ex. Enseignant en congé maladie" />
      </Feuille>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  titre: { flexDirection: 'row', alignItems: 'flex-start', gap: espaces.xl },
  flex: { flex: 1 },
  rangee: { flexDirection: 'row' },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.s },
  droite: { alignSelf: 'flex-end' },
});
