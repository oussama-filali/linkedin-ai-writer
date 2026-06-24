import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, checkingSession } = useAuth();

  useEffect(() => {
    if (!checkingSession) {
      if (isAuthenticated) {
        router.replace('/(tabs)/home' as never);
      } else {
        router.replace('/login' as never);
      }
    }
  }, [checkingSession, isAuthenticated, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#0077b5" style={styles.loader} />
        <Text style={styles.title}>LinkIA_Writer</Text>
        <Text style={styles.subtitle}>Chargement...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  content: {
    alignItems: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0077b5',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
