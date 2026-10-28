import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAccent } from '@/theme/accent';
import { couleurs, espaces, rayons } from '@/theme/tokens';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Carte : fond blanc, bordure discrète, rayon 16, padding 16. Pressable si `onPress`. */
export function Carte({ children, onPress, accessibilityLabel, style }: Props) {
  const { acc } = useAccent();
  if (!onPress) return <View style={[styles.carte, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.carte, pressed && { borderColor: acc, opacity: 0.92 }, style]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.fondCarte,
    borderWidth: 1,
    borderColor: couleurs.bordureCarte,
    borderRadius: rayons.carte,
    padding: espaces.page,
    gap: espaces.xl,
  },
});
