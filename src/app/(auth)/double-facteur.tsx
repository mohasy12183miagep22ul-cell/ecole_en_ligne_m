import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError, renvoyerCode, verifierCode } from '@/api';
import { Alerte } from '@/composants/Alerte';
import { Bouton } from '@/composants/Bouton';
import { CadreAuth } from '@/composants/CadreAuth';
import { Champ } from '@/composants/Champ';
import { Icone } from '@/composants/Icone';
import { faEnvelopeOpenText, faRotateRight } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { useSession } from '@/session/session';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces, rayons } from '@/theme/tokens';
import { nomAppareil } from '@/utils/appareil';

/** Second facteur (comptes direction) : code à 6 chiffres reçu par courriel, 10 minutes, 5 essais. */
export default function DoubleFacteur() {
  const params = useLocalSearchParams<{ defi: string; email: string; code?: string }>();
  const { ouvrir } = useSession();
  const { acc, doux } = useAccent();
  const [defi, setDefi] = useState(params.defi);
  const [codeDev, setCodeDev] = useState(params.code || null);
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [renvoi, setRenvoi] = useState(false);

  const retourConnexion = () => (router.canGoBack() ? router.back() : router.replace('/connexion'));

  const valider = async () => {
    if (!/^\d{6}$/.test(code)) return setErreur('Saisissez les 6 chiffres reçus par courriel.');
    setErreur(null);
    setEnvoi(true);
    try {
      const r = await verifierCode(defi, code, nomAppareil());
      if (r.statut === 'connecte') await ouvrir(r);
    } catch (e) {
      setEnvoi(false);
      if (e instanceof ApiError && e.code === 'E_DEFI_EXPIRE') {
        setErreur(`${e.message} Reconnectez-vous pour recevoir un nouveau code.`);
        setDefi('');
        return;
      }
      setCode('');
      setErreur(e instanceof ApiError ? e.message : 'Vérification impossible pour le moment.');
    }
  };

  const renvoyer = async () => {
    setRenvoi(true);
    setErreur(null);
    try {
      const r = await renvoyerCode(defi);
      if (r.statut === 'double_facteur') {
        setDefi(r.defi);
        setCodeDev(r.codeDeveloppement);
      }
      setCode('');
      setInfo('Un nouveau code vient d’être envoyé. L’ancien n’est plus valable.');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'E_DEFI_EXPIRE') setDefi('');
      setErreur(e instanceof ApiError ? e.message : 'Envoi impossible pour le moment.');
    } finally {
      setRenvoi(false);
    }
  };

  const expire = !defi;

  return (
    <CadreAuth>
      <View style={styles.formulaire}>
        <View style={[styles.pictogramme, { backgroundColor: doux }]}>
          <Icone icone={faEnvelopeOpenText} taille={22} couleur={acc} />
        </View>
        <View style={styles.titres}>
          <Texte taille="grand" graisse={800} accessibilityRole="header">
            Vérification en deux étapes
          </Texte>
          <Texte taille="base" couleur={couleurs.texteSecondaire}>
            Un code à 6 chiffres a été envoyé à{' '}
            <Texte taille="base" graisse={700}>
              {params.email}
            </Texte>
            . Il reste valable 10 minutes.
          </Texte>
        </View>

        {codeDev ? <Alerte ton="info">{`Développement : le code est ${codeDev}.`}</Alerte> : null}
        {info && !erreur ? <Alerte ton="succes">{info}</Alerte> : null}

        {!expire ? (
          <Champ
            libelle="Code de vérification"
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/\D/g, '').slice(0, 6));
              setErreur(null);
            }}
            placeholder="000000"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            grand
            hauteur={56}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={valider}
          />
        ) : null}

        {erreur ? <Alerte ton="erreur">{erreur}</Alerte> : null}

        {expire ? (
          <Bouton libelle="Retour à la connexion" onPress={retourConnexion} etire />
        ) : (
          <>
            <Bouton libelle="Valider le code" onPress={valider} chargement={envoi} etire />
            <Bouton
              libelle="Renvoyer un code"
              variante="lien"
              icone={faRotateRight}
              onPress={renvoyer}
              desactive={renvoi}
              style={styles.centre}
            />
            <Bouton libelle="Retour" variante="neutre" hauteur={44} onPress={retourConnexion} etire />
          </>
        )}
      </View>
    </CadreAuth>
  );
}

const styles = StyleSheet.create({
  formulaire: { gap: espaces.section },
  pictogramme: { width: 52, height: 52, borderRadius: rayons.carte, alignItems: 'center', justifyContent: 'center' },
  titres: { gap: espaces.s },
  centre: { alignSelf: 'center' },
});
