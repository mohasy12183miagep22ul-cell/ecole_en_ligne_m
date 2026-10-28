import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { dossierEnfant } from '@/api';
import type { DossierEnfant, Enfant } from '@/api/types';
import { Alerte } from '@/composants/Alerte';
import { Carte } from '@/composants/Carte';
import { GrilleDonnees } from '@/composants/Donnee';
import { Chargement, ErreurChargement } from '@/composants/EtatVide';
import { faEye, faStar } from '@/composants/icones';
import { Pastille } from '@/composants/Pastille';
import { Texte } from '@/composants/Texte';
import { EcranEnfant } from '@/famille/EcranEnfant';
import { cles } from '@/requetes/cles';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces } from '@/theme/tokens';
import { dateCourte } from '@/utils/format';

const STATUTS: Record<DossierEnfant['statut'], string> = {
  inscrit: 'Inscrit',
  transfere: 'Transféré',
  abandon: 'Abandon',
  diplome: 'Diplômé',
  exclu: 'Exclu',
};

export default function Dossier() {
  return <EcranEnfant>{(enfant) => <Contenu key={enfant.id} enfant={enfant} />}</EcranEnfant>;
}

/** Dossier en lecture seule : ni téléphone, ni pièce jointe, ni journal. */
function Contenu({ enfant }: { enfant: Enfant }) {
  const { acc, doux } = useAccent();
  const requete = useQuery({ queryKey: cles.dossier(enfant.id), queryFn: () => dossierEnfant(enfant.id) });

  if (requete.isPending) return <Chargement />;
  if (requete.error) return <ErreurChargement erreur={requete.error} reessayer={requete.refetch} />;

  const d = requete.data.enfant;
  return (
    <>
      <Alerte ton="neutre" icone={faEye}>
        Lecture seule — pour toute correction, contactez le secrétariat.
      </Alerte>
      <Carte>
        <Texte taille="l" graisse={700}>
          Identité et scolarité
        </Texte>
        <GrilleDonnees
          donnees={[
            ['Nom', d.nom],
            ['Prénoms', d.prenoms],
            ['Matricule', d.matricule],
            ['Sexe', d.sexe === 'F' ? 'Féminin' : 'Masculin'],
            ['Date de naissance', dateCourte(d.dateNaissance)],
            ['Lieu de naissance', d.lieuNaissance],
            ['Nationalité', d.nationalite ?? '—'],
            ['Statut', STATUTS[d.statut] ?? d.statut],
            ...(d.scolarite
              ? ([
                  [`Classe ${d.scolarite.annee}`, d.scolarite.classe ?? 'Non affecté'],
                  ['Niveau', d.scolarite.niveau ?? '—'],
                ] as [string, string][])
              : []),
          ]}
        />
      </Carte>
      <Carte>
        <Texte taille="l" graisse={700}>
          Tuteurs
        </Texte>
        {d.tuteurs.length === 0 ? (
          <Texte taille="m" couleur={couleurs.texteSecondaire}>
            Aucun tuteur enregistré.
          </Texte>
        ) : (
          d.tuteurs.map((t) => (
            <View key={`${t.nom}-${t.lienParente}`} style={styles.tuteur}>
              <View style={styles.flex}>
                <Texte taille="base" graisse={700}>
                  {t.nom}
                </Texte>
                <Texte taille="s" couleur={couleurs.texteSecondaire}>
                  {t.lienParente}
                </Texte>
              </View>
              {t.principal ? <Pastille libelle="Principal" fond={doux} texte={acc} icone={faStar} petite /> : null}
            </View>
          ))
        )}
      </Carte>
    </>
  );
}

const styles = StyleSheet.create({
  tuteur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaces.xl,
    paddingTop: espaces.l,
    borderTopWidth: 1,
    borderTopColor: couleurs.separateur,
  },
  flex: { flex: 1, gap: 2 },
});
