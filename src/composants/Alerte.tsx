import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icone, type IconeDef } from '@/composants/Icone';
import { faCircleCheck, faCircleExclamation, faCircleInfo, faTriangleExclamation } from '@/composants/icones';
import { Texte } from '@/composants/Texte';
import { couleurs, espaces, rayons } from '@/theme/tokens';

export type Ton = 'erreur' | 'attention' | 'succes' | 'info' | 'neutre';

const TONS: Record<Ton, { fond: string; texte: string; icone: IconeDef }> = {
  erreur: { fond: couleurs.erreurFond, texte: couleurs.erreurTexte, icone: faCircleExclamation },
  attention: { fond: couleurs.attentionFond, texte: couleurs.attentionTexte, icone: faTriangleExclamation },
  succes: { fond: couleurs.succesFond, texte: couleurs.succesTexte, icone: faCircleCheck },
  info: { fond: couleurs.infoFond, texte: couleurs.infoTexte, icone: faCircleInfo },
  neutre: { fond: couleurs.neutreFond, texte: couleurs.texteFort, icone: faCircleInfo },
};

/** Message d'état (rôle « alert » pour les erreurs et avertissements). */
export function Alerte({
  ton,
  children,
  icone,
  action,
}: {
  ton: Ton;
  children: ReactNode;
  icone?: IconeDef;
  action?: ReactNode;
}) {
  const t = TONS[ton];
  const annonce = ton === 'erreur' || ton === 'attention';
  return (
    <View
      accessibilityRole={annonce ? 'alert' : undefined}
      accessibilityLiveRegion={annonce ? 'polite' : undefined}
      style={[styles.alerte, { backgroundColor: t.fond }]}>
      <View style={styles.icone}>
        <Icone icone={icone ?? t.icone} taille={14} couleur={t.texte} />
      </View>
      <View style={styles.corps}>
        {typeof children === 'string' ? (
          <Texte taille="m" graisse={500} couleur={t.texte}>
            {children}
          </Texte>
        ) : (
          children
        )}
        {action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alerte: {
    flexDirection: 'row',
    gap: espaces.l,
    paddingHorizontal: espaces.xl,
    paddingVertical: espaces.l,
    borderRadius: rayons.champ,
  },
  icone: { paddingTop: 3 },
  corps: { flex: 1, gap: espaces.m },
});
