import { StyleSheet, View } from 'react-native';

import { Alerte } from '@/composants/Alerte';
import { Bouton } from '@/composants/Bouton';
import { CadreAuth } from '@/composants/CadreAuth';
import { FormulaireMotDePasse } from '@/composants/FormulaireMotDePasse';
import { faArrowRightFromBracket } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { useSession } from '@/session/session';
import { couleurs, espaces } from '@/theme/tokens';

/**
 * Compte créé par l'administrateur : le mot de passe doit être changé avant
 * tout le reste (le serveur refuse les autres appels en 403).
 */
export default function MotDePasseImpose() {
  const { utilisateur, mettreAJour, fermer } = useSession();
  return (
    <CadreAuth>
      <View style={styles.colonne}>
        <View style={styles.titres}>
          <Texte taille="grand" graisse={800} accessibilityRole="header">
            Choisissez votre mot de passe
          </Texte>
          <Texte taille="base" couleur={couleurs.texteSecondaire}>
            {`Bienvenue${utilisateur?.fullName ? `, ${utilisateur.fullName}` : ''}. Votre compte a été créé par l’établissement : remplacez le mot de passe provisoire pour continuer.`}
          </Texte>
        </View>
        <Alerte ton="info">Utilisez au moins 10 caractères. Évitez une date de naissance ou un prénom.</Alerte>
        <FormulaireMotDePasse onSucces={mettreAJour} />
        <Bouton libelle="Se déconnecter" variante="dangerContour" icone={faArrowRightFromBracket} hauteur={46} onPress={fermer} etire />
      </View>
    </CadreAuth>
  );
}

const styles = StyleSheet.create({
  colonne: { gap: espaces.section },
  titres: { gap: espaces.s },
});
