import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Espace, Role } from '@/api/types';
import { Alerte } from '@/composants/Alerte';
import { Avatar } from '@/composants/Avatar';
import { Bouton } from '@/composants/Bouton';
import { Carte } from '@/composants/Carte';
import { Ecran } from '@/composants/Ecran';
import { Entete } from '@/composants/Entete';
import { Feuille } from '@/composants/Feuille';
import { FormulaireMotDePasse } from '@/composants/FormulaireMotDePasse';
import { faArrowRightFromBracket, faChalkboardUser, faPeopleRoof, faUserTie } from '@/composants/icones';
import { Pastille } from '@/composants/Pastille';
import { Puces } from '@/composants/Selecteurs';
import { Texte } from '@/composants/Texte';
import { useToast } from '@/composants/Toast';
import { useFile } from '@/saisie/file';
import { ACCUEIL_ESPACE, useSession } from '@/session/session';
import { FournisseurAccent } from '@/theme/accent';
import { accents, couleurs, espaces } from '@/theme/tokens';
import { dateCourte, pluriel } from '@/utils/format';

const ROLES: Record<Role, string> = {
  admin: 'Administrateur',
  direction: 'Direction',
  secretariat: 'Secrétariat',
  enseignant: 'Enseignant',
  professeur_principal: 'Professeur principal',
  tuteur: 'Tuteur légal',
  eleve: 'Élève',
};

const ESPACES = {
  enseignant: { libelle: 'Enseignant', icone: faChalkboardUser },
  direction: { libelle: 'Direction', icone: faUserTie },
  portail: { libelle: 'Famille', icone: faPeopleRoof },
} as const;

export default function Profil() {
  const { utilisateur, espace } = useSession();
  return (
    <FournisseurAccent accent={espace ? accents[espace] : accents.neutre}>
      <View style={styles.page}>
        <Entete titre="Mon profil" retour sansProfil />
        {utilisateur ? <Contenu /> : null}
      </View>
    </FournisseurAccent>
  );
}

function Contenu() {
  const { utilisateur, espace, anneeActive, mettreAJour, choisirEspace, fermer } = useSession();
  const { total } = useFile();
  const toast = useToast();
  const [confirmer, setConfirmer] = useState(false);
  if (!utilisateur) return null;
  const u = utilisateur;
  const acc = espace ? accents[espace] : accents.neutre;

  const changerEspace = (e: Espace) => {
    choisirEspace(e);
    router.dismissAll();
    router.replace(ACCUEIL_ESPACE[e]);
  };

  return (
    <Ecran>
      <Carte style={styles.identite}>
        <Avatar initiales={u.initials} fond={acc.doux} texte={acc.acc} taille={60} />
        <View style={styles.flex}>
          <Texte taille="xl" graisse={800}>
            {u.fullName ?? u.email}
          </Texte>
          {u.sousTitre ? (
            <Texte taille="m" couleur={couleurs.texteSecondaire}>
              {u.sousTitre}
            </Texte>
          ) : null}
          <Texte taille="m" couleur={couleurs.texteSecondaire} selectable>
            {u.email}
          </Texte>
          <View style={styles.roles}>
            {u.roles.map((r) => (
              <Pastille key={r} libelle={ROLES[r] ?? r} fond={acc.doux} texte={acc.acc} petite />
            ))}
          </View>
        </View>
      </Carte>

      {anneeActive ? (
        <Alerte ton="neutre">{`Année scolaire ${anneeActive.libelle} · du ${dateCourte(anneeActive.dateDebut)} au ${dateCourte(anneeActive.dateFin)}`}</Alerte>
      ) : (
        <Alerte ton="attention">Aucune année scolaire active pour le moment : les listes sont vides.</Alerte>
      )}

      {u.espaces.length > 1 ? (
        <Carte>
          <Texte taille="l" graisse={700}>
            Espace affiché
          </Texte>
          <Puces
            options={u.espaces.map((e) => ({ cle: e, ...ESPACES[e] }))}
            valeur={espace}
            onChange={changerEspace}
            plein={false}
            defilant={false}
            libelleGroupe="Espace affiché"
          />
        </Carte>
      ) : null}

      <Carte>
        <Texte taille="l" graisse={700}>
          Changer de mot de passe
        </Texte>
        <FormulaireMotDePasse
          onSucces={(nouveau) => {
            mettreAJour(nouveau);
            toast('Mot de passe modifié');
          }}
        />
      </Carte>

      <Bouton
        libelle="Se déconnecter"
        variante="dangerContour"
        icone={faArrowRightFromBracket}
        onPress={() => (total ? setConfirmer(true) : fermer())}
        etire
      />

      <Feuille
        visible={confirmer}
        titre="Se déconnecter ?"
        texte={`${pluriel(total, 'note saisie n’a', 'notes saisies n’ont')} pas encore été envoyée${total > 1 ? 's' : ''} au serveur. La déconnexion efface tout de l’appareil : ces saisies seront perdues.`}
        confirmer="Se déconnecter"
        danger
        onConfirmer={fermer}
        onFermer={() => setConfirmer(false)}
      />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fondPage },
  identite: { flexDirection: 'row', alignItems: 'center', gap: espaces.xxl },
  flex: { flex: 1, gap: espaces.xs },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.s, marginTop: espaces.xs },
});
