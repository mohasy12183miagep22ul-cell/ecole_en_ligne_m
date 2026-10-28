import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError, motDePasseOublie } from '@/api';
import { Alerte } from '@/composants/Alerte';
import { Bouton } from '@/composants/Bouton';
import { CadreAuth } from '@/composants/CadreAuth';
import { Champ } from '@/composants/Champ';
import { Icone } from '@/composants/Icone';
import { faArrowLeft, faCircleCheck } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces, rayons } from '@/theme/tokens';

/**
 * Demande de lien de réinitialisation. Le nouveau mot de passe se choisit
 * sur la page web du lien, pas dans l'application.
 */
export default function MotDePasseOublie() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { acc, doux } = useAccent();
  const [email, setEmail] = useState(params.email ?? '');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [reponse, setReponse] = useState<{ message: string; lien: string | null } | null>(null);

  const retour = () => (router.canGoBack() ? router.back() : router.replace('/connexion'));

  const envoyer = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErreur('Adresse e-mail invalide.');
    setErreur(null);
    setEnvoi(true);
    try {
      const r = await motDePasseOublie(email.trim());
      setReponse({ message: r.message, lien: r.lienDeveloppement });
    } catch (e) {
      setErreur(e instanceof ApiError ? e.message : 'Envoi impossible pour le moment.');
    } finally {
      setEnvoi(false);
    }
  };

  if (reponse) {
    return (
      <CadreAuth>
        <View style={styles.formulaire}>
          <View style={[styles.pictogramme, { backgroundColor: doux }]}>
            <Icone icone={faCircleCheck} taille={24} couleur={acc} />
          </View>
          <Texte taille="grand" graisse={800} accessibilityRole="header">
            Vérifiez votre messagerie
          </Texte>
          <Texte taille="base" couleur={couleurs.texteSecondaire}>
            Si un compte est associé à{' '}
            <Texte taille="base" graisse={700}>
              {email.trim()}
            </Texte>
            , un lien valable 30 minutes vient d’être envoyé. Ouvrez-le pour choisir un nouveau mot de passe.
          </Texte>
          {reponse.lien ? <Alerte ton="info">{`Développement : ${reponse.lien}`}</Alerte> : null}
          <Bouton libelle="Retour à la connexion" variante="contour" onPress={retour} etire />
        </View>
      </CadreAuth>
    );
  }

  return (
    <CadreAuth>
      <View style={styles.formulaire}>
        <Bouton libelle="Connexion" variante="lien" icone={faArrowLeft} onPress={retour} />
        <View style={styles.titres}>
          <Texte taille="grand" graisse={800} accessibilityRole="header">
            Mot de passe oublié
          </Texte>
          <Texte taille="base" couleur={couleurs.texteSecondaire}>
            Saisissez l’adresse de votre compte : nous vous enverrons un lien de réinitialisation.
          </Texte>
        </View>
        <Champ
          libelle="Adresse e-mail"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setErreur(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={envoyer}
        />
        {erreur ? <Alerte ton="erreur">{erreur}</Alerte> : null}
        <Bouton libelle="Envoyer le lien" onPress={envoyer} chargement={envoi} etire />
      </View>
    </CadreAuth>
  );
}

const styles = StyleSheet.create({
  formulaire: { gap: espaces.section },
  titres: { gap: espaces.s },
  pictogramme: { width: 56, height: 56, borderRadius: rayons.carte, alignItems: 'center', justifyContent: 'center' },
});
