import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api';
import { Bouton } from '@/composants/Bouton';
import { Icone, type IconeDef } from '@/composants/Icone';
import { faCloud, faRotateRight, faTriangleExclamation } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { useAccent } from '@/theme/accent';
import { couleurs, espaces, rayons } from '@/theme/tokens';

/** Jamais une liste vide muette : une icône, une phrase, une action. */
export function EtatVide({
  icone,
  titre,
  texte,
  action,
}: {
  icone: IconeDef;
  titre: string;
  texte?: string;
  action?: { libelle: string; onPress: () => void; icone?: IconeDef };
}) {
  const { acc, doux } = useAccent();
  return (
    <View style={styles.vide}>
      <View style={[styles.rond, { backgroundColor: doux }]}>
        <Icone icone={icone} taille={22} couleur={acc} />
      </View>
      <Texte taille="l" graisse={700} centre>
        {titre}
      </Texte>
      {texte ? (
        <Texte taille="m" couleur={couleurs.texteSecondaire} centre style={styles.texte}>
          {texte}
        </Texte>
      ) : null}
      {action ? (
        <Bouton libelle={action.libelle} onPress={action.onPress} icone={action.icone} variante="contour" hauteur={46} />
      ) : null}
    </View>
  );
}

export function Chargement({ libelle = 'Chargement…' }: { libelle?: string }) {
  const { acc } = useAccent();
  return (
    <View style={styles.chargement} accessibilityLabel={libelle} accessibilityRole="progressbar">
      <ActivityIndicator color={acc} size="large" />
    </View>
  );
}

/** Message d'erreur de chargement, sans détail technique, avec « Réessayer ». */
export function ErreurChargement({ erreur, reessayer }: { erreur: unknown; reessayer: () => void }) {
  const horsLigne = erreur instanceof ApiError && erreur.horsLigne;
  let texte = 'Le serveur est indisponible pour le moment.';
  if (erreur instanceof ApiError) {
    if (erreur.status === 403) texte = 'Vous n’avez pas accès à cet élément.';
    else if (erreur.status === 404) texte = 'Cet élément est introuvable.';
    else if (erreur.status < 500) texte = erreur.message;
  }
  return (
    <EtatVide
      icone={horsLigne ? faCloud : faTriangleExclamation}
      titre={horsLigne ? 'Pas de connexion' : 'Impossible de charger'}
      texte={horsLigne ? 'Vérifiez votre connexion puis réessayez.' : texte}
      action={{ libelle: 'Réessayer', onPress: reessayer, icone: faRotateRight }}
    />
  );
}

const styles = StyleSheet.create({
  vide: {
    backgroundColor: couleurs.fondCarte,
    borderWidth: 1,
    borderColor: couleurs.bordureCarte,
    borderRadius: rayons.carte,
    paddingVertical: espaces.vaste,
    paddingHorizontal: espaces.large,
    alignItems: 'center',
    gap: espaces.xl,
  },
  rond: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  texte: { maxWidth: 340 },
  chargement: { paddingVertical: 48, alignItems: 'center' },
});
