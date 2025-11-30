import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, authenticating, error, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Renseigne ton email et un mot de passe.');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email.trim().toLowerCase(), password);
      } else {
        const result = await register(email.trim().toLowerCase(), password);
        if (result?.needsConfirmation) {
          Alert.alert('Vérifie ta boîte mail', "Confirme ton inscription via le lien Supabase avant de te connecter.");
          return;
        }
      }

      router.replace('/(tabs)/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connexion impossible. Réessaie dans un instant.';
      Alert.alert('Authentification', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}>
      <View style={styles.card}>
        <Text style={styles.title}>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</Text>
        <Text style={styles.subtitle}>
          Authentifie-toi avec ton compte Supabase pour accéder au studio LinkedIn AI.
        </Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="ton.email@example.com"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="Mot de passe Super Secret"
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9 }]}
          disabled={authenticating}>
          {authenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.7 }]}
          disabled={authenticating}>
          <Text style={styles.linkText}>
            {mode === 'login' ? "Pas de compte ? Inscription" : 'Déjà un compte ? Connexion'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}>
          <Text style={styles.backText}>← Retour</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#475467',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(10,126,164,0.35)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#dc2626',
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
  },
  backText: {
    color: '#1f2937',
  },
});
