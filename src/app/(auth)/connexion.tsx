import { router } from 'expo-router';
import { use, useRef, useState } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import { ApiError, connexion } from '@/api';
import { Alerte } from '@/composants/Alerte';
import { Bouton } from '@/composants/Bouton';
import { CadreAuth } from '@/composants/CadreAuth';
import { Champ } from '@/composants/Champ';
import { faArrowRight, faChalkboardUser, faPeopleRoof, faRotateRight, faShieldHalved, faUserTie } from '@/composants/icones';
import { Icone } from '@/composants/Icone';
import { Puces } from '@/composants/Selecteurs';
import { Texte } from '@/composants/Texte';
import { AccentAuthContexte } from '@/session/accent-auth';
import { useSession } from '@/session/session';
import { accents, couleurs, espaces } from '@/theme/tokens';
import { nomAppareil } from '@/utils/appareil';

/** Comptes du seeder serveur (docs/api.md § 7), proposés en développement seulement. */
const DEMO = [
  { cle: 'parent', libelle: 'Parent', icone: faPeopleRoof, email: 'f.diallo@mail.gn', accent: accents.portail },
  { cle: 'enseignant', libelle: 'Enseignant', icone: faChalkboardUser, email: 'i.sow@flamboyants.edu.gn', accent: accents.enseignant },
  { cle: 'direction', libelle: 'Direction', icone: faUserTie, email: 'm.camara@flamboyants.edu.gn', accent: accents.direction },
] as const;

export default function Connexion() {
  const { etat, ouvrir, oublierMotif, reprendre } = useSession();
  const teinter = use(AccentAuthContexte);
  const [demo, setDemo] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const champMotDePasse = useRef<TextInputInstance>(null);

  const motif = etat.statut === 'deconnecte' ? etat.motif : null;
  const reprise = etat.statut === 'deconnecte' && etat.reprise;

  const choisirDemo = (cle: string) => {
    const d = DEMO.find((x) => x.cle === cle);
    if (!d) return;
    setDemo(cle);
    setEmail(d.email);
    teinter(d.accent);
    setErreur(null);
  };

  const seConnecter = async () => {
    const adresse = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(adresse)) return setErreur('Adresse e-mail invalide.');
    if (!motDePasse) return setErreur('Saisissez votre mot de passe.');
    setErreur(null);
    oublierMotif();
    setEnvoi(true);
    try {
      const reponse = await connexion(adresse, motDePasse, nomAppareil());
      if (reponse.statut === 'double_facteur') {
        setEnvoi(false);
        setMotDePasse('');
        router.push({
          pathname: '/double-facteur',
          params: { defi: reponse.defi, email: reponse.email, code: reponse.codeDeveloppement ?? '' },
        });
        return;
      }
      await ouvrir(reponse);
    } catch (e) {
      setEnvoi(false);
      setErreur(e instanceof ApiError ? e.message : 'Connexion impossible pour le moment.');
    }
  };

  return (
    <CadreAuth accueil>
      <View style={styles.formulaire}>
        <View style={styles.titres}>
          <Texte taille="geant" graisse={800} accessibilityRole="header">
            Connexion
          </Texte>
          <Texte taille="base" couleur={couleurs.texteSecondaire}>
            Accédez à votre espace avec vos identifiants.
          </Texte>
        </View>

        {__DEV__ ? (
          <View style={styles.demo}>
            <Texte taille="s" graisse={600} couleur={couleurs.texteSecondaire} style={styles.capitales}>
              PROFIL DE DÉMONSTRATION
            </Texte>
            <Puces
              options={DEMO.map((d) => ({ cle: d.cle, libelle: d.libelle, icone: d.icone }))}
              valeur={demo}
              onChange={choisirDemo}
              plein={false}
              defilant={false}
              libelleGroupe="Profil de démonstration"
            />
          </View>
        ) : null}

        {motif ? (
          <Alerte
            ton={reprise ? 'attention' : 'info'}
            action={
              reprise ? <Bouton libelle="Réessayer" variante="lien" icone={faRotateRight} onPress={reprendre} /> : undefined
            }>
            {motif}
          </Alerte>
        ) : null}

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
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => champMotDePasse.current?.focus()}
          submitBehavior="submit"
        />
        <Champ
          ref={champMotDePasse}
          libelle="Mot de passe"
          value={motDePasse}
          onChangeText={(t) => {
            setMotDePasse(t);
            setErreur(null);
          }}
          motDePasse
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={seConnecter}
        />

        {erreur ? <Alerte ton="erreur">{erreur}</Alerte> : null}

        <Bouton
          libelle="Mot de passe oublié ?"
          variante="lien"
          style={styles.oubli}
          onPress={() => router.push({ pathname: '/mot-de-passe-oublie', params: { email: email.trim() } })}
        />

        <Bouton libelle="Se connecter" iconeApres={faArrowRight} onPress={seConnecter} chargement={envoi} etire />

        <View style={styles.note}>
          <Icone icone={faShieldHalved} taille={12} couleur={couleurs.texteTertiaire} />
          <Texte taille="s" couleur={couleurs.texteTertiaire}>
            Session sécurisée · compte verrouillé après 5 échecs
          </Texte>
        </View>
      </View>
    </CadreAuth>
  );
}

const styles = StyleSheet.create({
  formulaire: { gap: espaces.section },
  titres: { gap: espaces.s },
  demo: { gap: espaces.m },
  capitales: { letterSpacing: 0.7 },
  oubli: { alignSelf: 'flex-end', marginVertical: -espaces.m },
  note: { flexDirection: 'row', alignItems: 'center', gap: espaces.m },
});
