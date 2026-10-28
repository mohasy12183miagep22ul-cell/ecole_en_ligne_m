import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { Alerte } from '@/composants/Alerte';
import { Bouton, BoutonIcone } from '@/composants/Bouton';
import { LigneDonnee } from '@/composants/Donnee';
import { faXmark } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { couleurs, espaces, rayons } from '@/theme/tokens';

type Props = {
  visible: boolean;
  titre: string;
  texte?: string;
  lignes?: [string, string][];
  children?: ReactNode;
  confirmer: string;
  danger?: boolean;
  /** Action confirmée. Une erreur levée s'affiche dans la feuille, qui reste ouverte. */
  onConfirmer: () => Promise<unknown> | void;
  onFermer: () => void;
  /** Contrôle local avant l'envoi : renvoie un message pour bloquer. */
  verifier?: () => string | null;
};

/** Refus local, dont le message s'affiche tel quel à l'utilisateur. */
export class Refus extends Error {}

export function messageErreur(e: unknown) {
  if (e instanceof Refus) return e.message;
  if (e instanceof ApiError) {
    if (e.status === 403 && !e.regle) return 'Vous n’avez pas accès à cet élément.';
    if (e.status >= 500) return 'Le serveur est indisponible. Réessayez dans un instant.';
    return e.message;
  }
  return 'Une erreur inattendue est survenue.';
}

/** Feuille de confirmation montant du bas de l'écran. */
export function Feuille({
  visible,
  titre,
  texte,
  lignes,
  children,
  confirmer,
  danger,
  onConfirmer,
  onFermer,
  verifier,
}: Props) {
  const insets = useSafeAreaInsets();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const fermer = () => {
    if (envoi) return;
    setErreur(null);
    onFermer();
  };

  const valider = async () => {
    const bloque = verifier?.() ?? null;
    if (bloque) return setErreur(bloque);
    setErreur(null);
    setEnvoi(true);
    try {
      await onConfirmer();
      setEnvoi(false);
      onFermer();
    } catch (e) {
      setEnvoi(false);
      setErreur(messageErreur(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={fermer} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.fond} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={fermer} accessibilityLabel="Fermer" accessibilityRole="button" />
        <View
          style={[styles.panneau, { paddingBottom: espaces.ample + insets.bottom }]}
          accessibilityViewIsModal
          accessibilityRole="none">
          <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled" bounces={false}>
            <View style={styles.entete}>
              <Texte taille="xl" graisse={800} style={styles.titre} accessibilityRole="header">
                {titre}
              </Texte>
              <BoutonIcone
                icone={faXmark}
                libelle="Fermer"
                onPress={fermer}
                taille={36}
                fond={couleurs.blanc}
                bordure={couleurs.pastilleInactive}
                couleur={couleurs.texteFort}
                tailleIcone={15}
              />
            </View>
            {texte ? (
              <Texte taille="base" couleur={couleurs.texteSecondaire}>
                {texte}
              </Texte>
            ) : null}
            {lignes?.length ? (
              <View style={styles.lignes}>
                {lignes.map(([k, v], i) => (
                  <LigneDonnee key={k} libelle={k} valeur={v} premiere={i === 0} />
                ))}
              </View>
            ) : null}
            {children}
            {erreur ? <Alerte ton="erreur">{erreur}</Alerte> : null}
            <View style={styles.actions}>
              <Bouton libelle="Annuler" variante="neutre" onPress={fermer} hauteur={46} desactive={envoi} style={styles.action} />
              <Bouton
                libelle={confirmer}
                variante={danger ? 'danger' : 'principal'}
                onPress={valider}
                hauteur={46}
                chargement={envoi}
                style={styles.action}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, justifyContent: 'flex-end', backgroundColor: couleurs.voile },
  panneau: {
    backgroundColor: couleurs.blanc,
    borderTopLeftRadius: rayons.feuille,
    borderTopRightRadius: rayons.feuille,
    paddingTop: espaces.ample,
    maxHeight: '90%',
  },
  contenu: { paddingHorizontal: espaces.large, gap: espaces.page },
  entete: { flexDirection: 'row', alignItems: 'flex-start', gap: espaces.xl },
  titre: { flex: 1 },
  lignes: { borderWidth: 1, borderColor: couleurs.bordureCarte, borderRadius: rayons.moyen },
  actions: { flexDirection: 'row', gap: espaces.l },
  action: { flex: 1 },
});
