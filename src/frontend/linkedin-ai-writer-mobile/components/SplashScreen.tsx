import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';

/**
 * Écran d'introduction (splash).
 *
 * Animation simple, fluide et fiable (Animated natif, zéro dépendance lourde) :
 * le logo LinkIA_Writer apparaît en fondu + légère montée d'échelle, avec un
 * halo "liquid glass" qui pulse doucement derrière. Pas de 3D ni de particules
 * (pour ne jamais ramer/crasher sur les téléphones des testeurs).
 */
export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  // Valeurs d'animation
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const haloScale = useRef(new Animated.Value(0.9)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrée du logo : fondu + échelle
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(haloOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    // Halo qui respire doucement (effet glass vivant)
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloScale, {
          toValue: 1.15,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloScale, {
          toValue: 0.9,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timer = setTimeout(onFinish, 2400);
    return () => clearTimeout(timer);
  }, [onFinish, opacity, scale, haloScale, haloOpacity]);

  return (
    <View style={styles.container}>
      {/* Halo flou derrière le logo (liquid glass) */}
      <Animated.View
        style={[
          styles.halo,
          { opacity: haloOpacity, transform: [{ scale: haloScale }] },
        ]}
      />

      {/* Logo de l'app (image fidèle) */}
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={require('../assets/images/L.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Fond cohérent avec le bleu du logo
    backgroundColor: '#4F6CE8',
  },
  halo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 32,
  },
});
