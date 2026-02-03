import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { isAuthenticated, checkingSession } = useAuth();

  useEffect(() => {
    if (checkingSession) return;

    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/login');
    }
  }, [checkingSession, isAuthenticated, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0a7ea4" />
      <Text style={styles.text}>Finalisation de la connexion sécurisée...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f6fa',
  },
  text: {
    marginTop: 16,
    color: '#475467',
    textAlign: 'center',
  },
});
