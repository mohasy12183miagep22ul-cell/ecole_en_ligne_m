import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BandeauHorsLigne } from '@/composants/BandeauHorsLigne';
import { BoutonIcone } from '@/composants/Bouton';
import { Icone } from '@/composants/Icone';
import { faArrowLeft, faGraduationCap } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { useSession } from '@/session/session';
import { useAccent } from '@/theme/accent';
import { couleurs, dimensions, espaces, rayons } from '@/theme/tokens';

/**
 * Entête mobile de 60 pt : retour contextuel ou logo, titre, espace courant,
 * accès au profil. Respecte la zone sûre du haut (encoche).
 */
export function Entete({ titre, retour, sansProfil }: { titre: string; retour?: boolean; sansProfil?: boolean }) {
  const insets = useSafeAreaInsets();
  const { acc, doux, libelle } = useAccent();
  const { utilisateur } = useSession();

  return (
    <View style={[styles.entete, { paddingTop: insets.top }]}>
      <View style={styles.barre}>
        {retour ? (
          <BoutonIcone icone={faArrowLeft} libelle="Retour" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        ) : (
          <View style={[styles.logo, { backgroundColor: acc }]}>
            <Icone icone={faGraduationCap} taille={14} couleur={couleurs.blanc} />
          </View>
        )}
        <View style={styles.titres}>
          <Texte taille="xl" graisse={800} numberOfLines={1} accessibilityRole="header">
            {titre}
          </Texte>
          <Texte taille="xs" couleur={couleurs.texteSecondaire} numberOfLines={1}>
            {libelle}
          </Texte>
        </View>
        {!sansProfil && utilisateur ? (
          <Pressable
            onPress={() => router.push('/profil')}
            accessibilityRole="button"
            accessibilityLabel="Mon profil"
            style={({ pressed }) => [styles.profil, pressed && styles.presse]}>
            <View style={[styles.avatar, { backgroundColor: doux }]}>
              <Texte taille="s" graisse={700} couleur={acc} maxFontSizeMultiplier={1.2}>
                {utilisateur.initials}
              </Texte>
            </View>
          </Pressable>
        ) : null}
      </View>
      <BandeauHorsLigne />
    </View>
  );
}

const styles = StyleSheet.create({
  entete: {
    backgroundColor: couleurs.blanc,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.bordureCarte,
  },
  barre: {
    height: dimensions.entete,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaces.m,
    paddingLeft: espaces.xl,
    paddingRight: espaces.m,
  },
  logo: {
    width: dimensions.logo,
    height: dimensions.logo,
    borderRadius: rayons.champ,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: espaces.xs,
  },
  titres: { flex: 1, minWidth: 0 },
  profil: { width: dimensions.cible, height: dimensions.cible, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  presse: { opacity: 0.7 },
});
