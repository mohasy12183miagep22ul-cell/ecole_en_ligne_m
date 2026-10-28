import { StyleSheet, View } from 'react-native';

import { EtatVide } from '@/composants/EtatVide';
import { Icone } from '@/composants/Icone';
import { faFileLines, faHourglassHalf } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { EcranEnfant } from '@/famille/EcranEnfant';
import { useSession } from '@/session/session';
import { couleurs, espaces, rayons } from '@/theme/tokens';

/** Bulletins délivrés (RG18). Le circuit de publication n'est pas encore exposé par le serveur. */
export default function Bulletins() {
  const { anneeActive } = useSession();
  return (
    <EcranEnfant>
      {(enfant) => (
        <>
          {anneeActive ? (
            <View style={styles.attente} accessible accessibilityLabel={`Année ${anneeActive.libelle} : en attente de publication par l’établissement`}>
              <View style={styles.icone}>
                <Icone icone={faHourglassHalf} taille={16} couleur={couleurs.texteSecondaire} />
              </View>
              <View style={styles.flex}>
                <Texte taille="l" graisse={700}>{`Année ${anneeActive.libelle}`}</Texte>
                <Texte taille="m" couleur={couleurs.texteSecondaire}>
                  En attente de publication par l’établissement
                </Texte>
              </View>
            </View>
          ) : null}
          <EtatVide
            icone={faFileLines}
            titre={`Aucun bulletin pour ${enfant.prenoms}`}
            texte="Les bulletins délivrés de l’année et des années passées s’afficheront ici."
          />
        </>
      )}
    </EcranEnfant>
  );
}

const styles = StyleSheet.create({
  attente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaces.xxl,
    padding: espaces.page,
    borderRadius: rayons.carte,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: couleurs.bordurePointillee,
    backgroundColor: couleurs.fondDiscret,
  },
  icone: {
    width: 42,
    height: 42,
    borderRadius: rayons.moyen,
    backgroundColor: couleurs.neutreFond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
});
