import { StyleSheet, View } from 'react-native';

import { API_URL } from '@/api';
import { Bouton } from '@/composants/Bouton';
import { CadreAuth } from '@/composants/CadreAuth';
import { Icone } from '@/composants/Icone';
import { faArrowRightFromBracket, faDesktop } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { useSession } from '@/session/session';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces, rayons } from '@/theme/tokens';

/** Compte sans espace mobile (administrateur, secrétariat) : renvoi vers le web. */
export default function WebUniquement() {
  const { utilisateur, fermer } = useSession();
  const { acc, doux } = useAccent();
  return (
    <CadreAuth>
      <View style={styles.colonne}>
        <View style={[styles.pictogramme, { backgroundColor: doux }]}>
          <Icone icone={faDesktop} taille={24} couleur={acc} />
        </View>
        <Texte taille="grand" graisse={800} accessibilityRole="header">
          Votre espace est sur le web
        </Texte>
        <Texte taille="base" couleur={couleurs.texteSecondaire}>
          {`${utilisateur?.fullName ?? 'Votre compte'} n’a pas d’espace dans l’application mobile. Le paramétrage, le secrétariat et l’administration se font depuis un ordinateur, à l’adresse :`}
        </Texte>
        <Texte taille="l" graisse={700} selectable>
          {API_URL}
        </Texte>
        <Bouton libelle="Se déconnecter" variante="dangerContour" icone={faArrowRightFromBracket} onPress={fermer} etire />
      </View>
    </CadreAuth>
  );
}

const styles = StyleSheet.create({
  colonne: { gap: espaces.section },
  pictogramme: { width: 56, height: 56, borderRadius: rayons.carte, alignItems: 'center', justifyContent: 'center' },
});
