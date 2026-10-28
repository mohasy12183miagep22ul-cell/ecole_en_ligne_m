import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { CarteAffectation } from '@/api/types';
import { Alerte } from '@/composants/Alerte';
import { Barre } from '@/composants/Barre';
import { Carte } from '@/composants/Carte';
import { Ecran } from '@/composants/Ecran';
import { Chargement, ErreurChargement, EtatVide } from '@/composants/EtatVide';
import { Icone } from '@/composants/Icone';
import { faCalendarDays, faChevronRight, faDoorClosed, faDoorOpen, faStar, faUsers } from '@/composants/icones';
import { Pastille } from '@/composants/Pastille';
import { Texte } from '@/composants/Texte';
import { phraseSaisie, useAffectations } from '@/enseignant/commun';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces, rayons } from '@/theme/tokens';
import { dateCourte, pluriel } from '@/utils/format';

export default function Classes() {
  const { data, isPending, error, refetch } = useAffectations();

  if (isPending) return <Chargement />;
  if (error) {
    return (
      <Ecran sousOnglets>
        <ErreurChargement erreur={error} reessayer={refetch} />
      </Ecran>
    );
  }

  const ouverte = data.affectations.find((a) => a.saisie?.ouverte && !a.saisie.derogation)?.saisie ?? null;

  return (
    <Ecran sousOnglets rafraichir={refetch}>
      {!data.annee ? (
        <EtatVide
          icone={faCalendarDays}
          titre="Aucune année scolaire active"
          texte="Vos classes apparaîtront dès l’activation de la nouvelle année par l’établissement."
        />
      ) : data.affectations.length === 0 ? (
        <EtatVide
          icone={faUsers}
          titre="Aucune classe affectée"
          texte="Aucune classe ni matière ne vous est confiée cette année. Rapprochez-vous de la direction."
        />
      ) : (
        <>
          {data.periode ? (
            ouverte ? (
              <Alerte ton="succes" icone={faDoorOpen}>
                {phraseSaisie(ouverte, data.periode.libelle)}
              </Alerte>
            ) : (
              <Alerte ton="neutre" icone={faDoorClosed}>
                {`${data.periode.libelle} · fenêtre de saisie du ${dateCourte(data.periode.debutSaisie)} au ${dateCourte(data.periode.finSaisie)}`}
              </Alerte>
            )
          ) : null}
          {data.affectations.map((a) => (
            <CarteClasse key={a.id} affectation={a} />
          ))}
        </>
      )}
    </Ecran>
  );
}

function CarteClasse({ affectation: a }: { affectation: CarteAffectation }) {
  const { acc, doux } = useAccent();
  const faits = a.enCours ? a.enCours.faits / Math.max(1, a.enCours.effectif) : 0;
  const derogation = !!a.saisie?.ouverte && a.saisie.derogation;
  const close = !!a.saisie && !a.saisie.ouverte;

  return (
    <Carte
      onPress={() => router.navigate({ pathname: '/enseignant/evaluations', params: { affectation: String(a.id) } })}
      accessibilityLabel={`Classe de ${a.classe}, ${a.matiere}, ${a.effectif} élèves, ${a.evaluations} évaluations`}>
      <View style={styles.ligne}>
        <View style={[styles.carre, { backgroundColor: doux }]}>
          <Texte taille="l" graisse={800} couleur={acc} numberOfLines={1} adjustsFontSizeToFit>
            {a.classe}
          </Texte>
        </View>
        <View style={styles.flex}>
          <Texte taille="l" graisse={700}>{`Classe de ${a.classe}`}</Texte>
          <Texte taille="s" couleur={couleurs.texteSecondaire}>
            {`${a.matiere} · ${pluriel(a.effectif, 'élève')} · ${pluriel(a.evaluations, 'évaluation')}`}
          </Texte>
        </View>
        <Icone icone={faChevronRight} taille={14} couleur={couleurs.texteTertiaire} />
      </View>

      {a.professeurPrincipal || derogation || close ? (
        <View style={styles.pastilles}>
          {a.professeurPrincipal ? (
            <Pastille libelle="Professeur principal" fond={couleurs.neutreFond} texte={couleurs.texteFort} icone={faStar} />
          ) : null}
          {derogation ? (
            <Pastille libelle={phraseSaisie(a.saisie)} fond={couleurs.infoFond} texte={couleurs.infoTexte} icone={faDoorOpen} />
          ) : null}
          {close ? (
            <Pastille libelle={phraseSaisie(a.saisie)} fond={couleurs.neutreFond} texte={couleurs.texteFort} icone={faDoorClosed} />
          ) : null}
        </View>
      ) : null}

      {a.enCours ? (
        <Pressable
          onPress={() => router.push(`/enseignant/evaluation/${a.enCours!.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Reprendre la saisie : ${a.enCours.titre}, ${a.enCours.faits} sur ${a.enCours.effectif}`}
          style={({ pressed }) => [styles.enCours, pressed && { backgroundColor: doux }]}>
          <View style={styles.ligneEnCours}>
            <Texte taille="s" couleur={couleurs.texteFort} style={styles.flex} numberOfLines={1}>
              {`En cours · ${a.enCours.titre}`}
            </Texte>
            <Texte taille="s" graisse={700}>{`${a.enCours.faits}/${a.enCours.effectif}`}</Texte>
          </View>
          <View style={styles.ligneEnCours}>
            <Barre ratio={faits} />
          </View>
        </Pressable>
      ) : null}
    </Carte>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', gap: espaces.xl },
  carre: {
    width: 46,
    height: 46,
    borderRadius: rayons.moyen,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaces.xs,
  },
  flex: { flex: 1 },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.s },
  enCours: { gap: espaces.s, minHeight: 44, justifyContent: 'center', borderRadius: rayons.champ, marginHorizontal: -espaces.s, paddingHorizontal: espaces.s, paddingVertical: espaces.xs },
  ligneEnCours: { flexDirection: 'row', alignItems: 'center', gap: espaces.m },
});
