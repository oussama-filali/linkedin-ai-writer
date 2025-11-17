import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <Animated.View style={styles.logoContainer}>
        <Text style={styles.logo}>🤖</Text>
      </Animated.View>
      <Text style={styles.title}>LinkedIn AI Writer</Text>
      <ActivityIndicator size="large" color="#0077b5" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0077b5',
    marginBottom: 8,
  },
});
