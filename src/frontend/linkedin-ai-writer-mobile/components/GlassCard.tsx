import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * Carte "liquid glass" réutilisable (glassmorphism).
 *
 * Effet verre dépoli : un flou translucide (expo-blur) + une fine bordure
 * lumineuse, pour un rendu moderne premium. À poser sur un fond coloré/dégradé
 * pour que le flou se voie.
 *
 * Le flou natif (BlurView) marche sur iOS/Android. Sur le web, expo-blur
 * retombe sur un fond semi-transparent — on renforce donc le fond pour rester joli.
 *
 * @param intensity - intensité du flou (0-100), défaut 40
 * @param tint - teinte du verre: 'light' | 'dark' | 'default'
 */
export function GlassCard({
  children,
  style,
  contentStyle,
  intensity = 40,
  tint = 'light',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}) {
  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      {/* Voile clair par-dessus le flou pour la lisibilité du contenu */}
      <View style={styles.overlay} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    // Ombre douce pour décoller la carte du fond
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      Platform.OS === 'web'
        ? 'rgba(255,255,255,0.55)' // le flou web est faible -> on renforce
        : 'rgba(255,255,255,0.28)',
  },
  content: {
    padding: 18,
  },
});
