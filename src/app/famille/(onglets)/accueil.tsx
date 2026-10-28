import { StyleSheet, View } from 'react-native';

import type { Enfant } from '@/api/types';
import { Alerte } from '@/composants/Alerte';
import { NOM_ETABLISSEMENT } from '@/composants/CadreAuth';
import { EtatVide } from '@/composants/EtatVide';
import { faFileLines } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { EcranEnfant } from '@/famille/EcranEnfant';
import { useSession } from '@/session/session';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces, rayons } from '@/theme/tokens';
import { initiales } from '@/utils/format';

export default function Accueil() {
  return <EcranEnfant>{(enfant) => <Contenu enfant={enfant} />}</EcranEnfant>;
}

function Contenu({ enfant }: { enfant: Enfant }) {
  const { acc } = useAccent();
  const { anneeActive } = useSession();
  return (
    <>
      <View style={[styles.carte, { backgroundColor: acc }]}>
        <View style={styles.ligne}>
          <View style={styles.avatar}>
            <Texte taille="xl" graisse={800} couleur={couleurs.blanc}>
              {initiales(enfant.nom, enfant.prenoms)}
            </Texte>
          </View>
          <View style={styles.flex}>
            <Texte taille="titre" graisse={800} couleur={couleurs.blanc}>
              {`${enfant.prenoms} ${enfant.nom}`}
            </Texte>
            <Texte taille="m" couleur={couleurs.blanc}>
              {`${enfant.classe ?? 'Pas d’inscription validée'} · Matricule ${enfant.matricule}`}
            </Texte>
          </View>
        </View>
        <Texte taille="m" couleur={couleurs.blanc}>
          {`${NOM_ETABLISSEMENT}${anneeActive ? ` · Année ${anneeActive.libelle}` : ''}`}
        </Texte>
      </View>

      {/* RG18 : rien d'autre que le publié. Aucun bulletin n'est encore exposé par le serveur. */}
      <Alerte ton="info">Les bulletins de l’année seront visibles ici dès leur publication par l’établissement.</Alerte>
      <EtatVide
        icone={faFileLines}
        titre="Aucun bulletin délivré pour l’instant"
        texte={`Les résultats de ${enfant.prenoms} apparaîtront après la publication du premier bulletin par l’établissement.`}
      />
    </>
  );
}

const styles = StyleSheet.create({
  carte: { borderRadius: rayons.grand, padding: espaces.large, gap: espaces.xxl },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: espaces.xxl },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: couleurs.surAccentDoux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
});
