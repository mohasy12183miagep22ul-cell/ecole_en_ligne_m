import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { recapitulatif } from '@/api';
import { Barre } from '@/composants/Barre';
import { Carte } from '@/composants/Carte';
import { Ecran } from '@/composants/Ecran';
import { Chargement, ErreurChargement, EtatVide } from '@/composants/EtatVide';
import { faChartColumn, faUsers } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { SelecteurAffectation, SelecteurPeriode, useAffectations, usePeriodes } from '@/enseignant/commun';
import { cles } from '@/requetes/cles';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces } from '@/theme/tokens';
import { nombre, pluriel, pourcentage, rang } from '@/utils/format';

/** Synthèse de la matière dans la classe et classement des élèves (RG16 : ex aequo, rang suivant sauté). */
export default function Recap() {
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
    queryKey: cles.recap(affectation?.id ?? 0, periode),
    queryFn: () => recapitulatif(affectation!.id, periode ?? undefined),
    enabled: !!affectation && (periode !== null || sansPeriode || !!periodes.error),
  });

  if (affectations.isPending) return <Chargement />;
  if (affectations.error) {
    return (
      <Ecran sousOnglets>
        <ErreurChargement erreur={affectations.error} reessayer={affectations.refetch} />
      </Ecran>
    );
  }
  if (!affectation) {
    return (
      <Ecran sousOnglets>
        <EtatVide icone={faUsers} titre="Aucune classe affectée" texte="Le récapitulatif porte sur vos classes de l’année active." />
      </Ecran>
    );
  }

  const r = requete.data;
  const s = r?.synthese;

  return (
    <Ecran sousOnglets rafraichir={requete.refetch}>
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

      {requete.isPending ? (
        <Chargement />
      ) : requete.error ? (
        <ErreurChargement erreur={requete.error} reessayer={requete.refetch} />
      ) : !s ? (
        <EtatVide icone={faChartColumn} titre="Pas encore de résultats" texte="Le récapitulatif apparaît dès que des notes sont saisies sur la période." />
      ) : (
        <>
          <Carte>
            <View style={styles.titre}>
              <Texte taille="l" graisse={800}>{`${s.classe} · ${s.matiere}`}</Texte>
              <Texte taille="s" couleur={couleurs.texteSecondaire}>
                {pluriel(s.effectif, 'élève')}
              </Texte>
            </View>
            <View style={styles.moyenne}>
              <Texte taille="chiffre" graisse={800} couleur={acc}>
                {nombre(s.moyenne)}
              </Texte>
              <Texte taille="s" couleur={couleurs.texteSecondaire}>
                moyenne de classe / 20
              </Texte>
            </View>
            <View style={styles.rangee}>
              <Barre ratio={(s.moyenne ?? 0) / 20} />
            </View>
            <View style={styles.chiffres}>
              <Texte taille="s" couleur={couleurs.texteSecondaire}>{`Min ${nombre(s.min)}`}</Texte>
              <Texte taille="s" couleur={couleurs.texteSecondaire}>{`Max ${nombre(s.max)}`}</Texte>
              <Texte taille="s" couleur={couleurs.texteSecondaire}>{`≥ 10 : ${pourcentage(s.reussite)}`}</Texte>
            </View>
          </Carte>

          <Carte>
            <Texte taille="l" graisse={700}>
              {`Classement${r?.periode ? ` · ${r.periode.libelle}` : ''}`}
            </Texte>
            {r!.eleves.map((e) => {
              const sous = e.moyenne !== null && e.moyenne < 10;
              return (
                <View
                  key={e.id}
                  style={styles.eleve}
                  accessible
                  accessibilityLabel={`${rang(e.rang)}, ${e.nom} ${e.prenoms}, ${nombre(e.moyenne)} sur 20`}>
                  <Texte taille="m" graisse={800} couleur={acc} style={styles.rang}>
                    {rang(e.rang)}
                  </Texte>
                  <Texte taille="m" numberOfLines={1} style={styles.nom}>
                    {`${e.nom} ${e.prenoms}`}
                  </Texte>
                  <View style={styles.barre}>
                    <Barre ratio={(e.moyenne ?? 0) / 20} couleur={sous ? couleurs.attentionBarre : undefined} />
                  </View>
                  <Texte taille="m" graisse={700} style={styles.note}>
                    {nombre(e.moyenne)}
                  </Texte>
                </View>
              );
            })}
          </Carte>
        </>
      )}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  titre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: espaces.m },
  moyenne: { flexDirection: 'row', alignItems: 'baseline', gap: espaces.s },
  rangee: { flexDirection: 'row' },
  chiffres: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: espaces.m },
  eleve: { flexDirection: 'row', alignItems: 'center', gap: espaces.l, minHeight: 32 },
  rang: { width: 34 },
  nom: { flex: 1 },
  barre: { width: 72, flexDirection: 'row' },
  note: { width: 48, textAlign: 'right' },
});
