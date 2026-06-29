import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Fond d'écran dégradé "liquid glass".
 *
 * Pose un dégradé doux (bleu cohérent avec le logo) derrière le contenu, pour
 * que les GlassCard posées dessus laissent transparaître le flou coloré.
 * À utiliser comme conteneur racine d'un écran.
 */
export function ScreenBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#eef2ff', '#dbe4ff', '#c7d6ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Deux halos colorés flous pour la profondeur (effet verre) */}
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  blob: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  blobTop: {
    top: -80,
    right: -60,
    backgroundColor: 'rgba(79, 108, 232, 0.18)',
  },
  blobBottom: {
    bottom: -100,
    left: -70,
    backgroundColor: 'rgba(124, 152, 255, 0.16)',
  },
});
