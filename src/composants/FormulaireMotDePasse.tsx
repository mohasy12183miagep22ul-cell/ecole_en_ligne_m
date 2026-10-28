import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError, changerMotDePasse } from '@/api';
import type { Utilisateur } from '@/api/types';
import { Alerte } from '@/composants/Alerte';
import { Bouton } from '@/composants/Bouton';
import { Champ } from '@/composants/Champ';
import { messageErreur } from '@/composants/Feuille';
import { couleurs, espaces } from '@/theme/tokens';

type Erreurs = { actuel?: string; nouveau?: string; confirmation?: string; general?: string };

/** Changement de mot de passe : 10 à 128 caractères, différent de l'actuel. */
export function FormulaireMotDePasse({ onSucces }: { onSucces: (u: Utilisateur) => void }) {
  const [actuel, setActuel] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [envoi, setEnvoi] = useState(false);

  const longueurOk = nouveau.length >= 10 && nouveau.length <= 128;

  const enregistrer = async () => {
    const e: Erreurs = {};
    if (!actuel) e.actuel = 'Saisissez votre mot de passe actuel.';
    if (!longueurOk) e.nouveau = 'Entre 10 et 128 caractères.';
    else if (nouveau === actuel) e.nouveau = 'Le nouveau mot de passe doit être différent de l’actuel.';
    if (confirmation !== nouveau) e.confirmation = 'Les deux saisies ne correspondent pas.';
    setErreurs(e);
    if (Object.keys(e).length) return;
    setEnvoi(true);
    try {
      const r = await changerMotDePasse(actuel, nouveau, confirmation);
      setActuel('');
      setNouveau('');
      setConfirmation('');
      onSucces(r.utilisateur);
    } catch (err) {
      if (err instanceof ApiError && err.champs.length) {
        setErreurs({
          actuel: err.champ('actuel') ?? undefined,
          nouveau: err.champ('nouveau') ?? undefined,
          confirmation: err.champ('confirmation') ?? undefined,
        });
      } else {
        setErreurs({ general: messageErreur(err) });
      }
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <View style={styles.formulaire}>
      <Champ
        libelle="Mot de passe actuel"
        value={actuel}
        onChangeText={setActuel}
        motDePasse
        autoComplete="current-password"
        erreur={erreurs.actuel}
      />
      <Champ
        libelle="Nouveau mot de passe"
        value={nouveau}
        onChangeText={setNouveau}
        motDePasse
        autoComplete="new-password"
        textContentType="newPassword"
        aide={`${nouveau.length} / 10 caractères minimum`}
        couleurAide={longueurOk ? couleurs.succesTexte : couleurs.texteSecondaire}
        erreur={erreurs.nouveau}
      />
      <Champ
        libelle="Confirmer"
        value={confirmation}
        onChangeText={setConfirmation}
        motDePasse
        autoComplete="new-password"
        erreur={erreurs.confirmation}
        returnKeyType="done"
        onSubmitEditing={enregistrer}
      />
      {erreurs.general ? <Alerte ton="erreur">{erreurs.general}</Alerte> : null}
      <Bouton libelle="Enregistrer" onPress={enregistrer} chargement={envoi} hauteur={46} style={styles.bouton} />
    </View>
  );
}

const styles = StyleSheet.create({
  formulaire: { gap: espaces.xxl },
  bouton: { alignSelf: 'flex-start' },
});
