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
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/services/supabase-client';

WebBrowser.maybeCompleteAuthSession();

function urlHasAuthCode(url: string) {
  return url.includes('code=');
}

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

  const buildRedirectUrl = () => {
    // Web: on garde une URL HTTP(S) de notre app web.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }

    // Mobile (build .apk/.ipa) : on FORCE le scheme natif de l'app.
    // Sinon Linking.createURL retombe sur localhost:8081 / exp:// (contexte dev),
    // ce qui casse le retour OAuth dans une app installée.
    // Le scheme 'linkedinaiwritermobile' est défini dans app.json.
    return 'linkedinaiwritermobile://auth/callback';
  };

  const handleLinkedInLogin = async () => {
    try {
      const redirectUrl = buildRedirectUrl();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: redirectUrl,
          // Sur mobile natif, on gère nous-même l'ouverture du navigateur.
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        throw error;
      }

      console.log('Redirection vers LinkedIn pour OAuth', data?.url);

      // Sur le web, Supabase effectue une redirection complète.
      if (Platform.OS === 'web') {
        return;
      }

      if (data?.url) {
        // Ouvre la session OAuth et attend le retour vers redirectUrl.
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success' && result.url) {
          // PKCE : LinkedIn/Supabase renvoie un "code" dans l'URL de retour.
          // On l'échange contre une vraie session (qui sera persistée).
          if (urlHasAuthCode(result.url)) {
            const { data: sessionData, error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(result.url);
            if (exchangeError) {
              throw exchangeError;
            }
            // Session créée : on entre dans l'app. (onAuthStateChange dans
            // use-auth.ts applique aussi la session, mais on force la nav ici
            // pour un retour immédiat et fiable.)
            if (sessionData?.session) {
              router.replace('/(tabs)/home');
            }
          }
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          // L'utilisateur a fermé le navigateur : on ne fait rien (pas d'erreur).
          return;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connexion LinkedIn impossible pour le moment.';
      Alert.alert('Connexion LinkedIn', message);
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
          Authentifie-toi avec ton LinkedIn pour accéder au studio LinkIA_Writer.
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
          autoCapitalize="none"
          placeholder="Mot de passe"
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

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.divider} />
        </View>

        <Pressable
          onPress={handleLinkedInLogin}
          style={({ pressed }) => [styles.oauthButton, pressed && { opacity: 0.9 }]}
          disabled={authenticating}>
          <Text style={styles.oauthText}>Continuer avec LinkedIn</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            // Évite l'erreur "GO_BACK" quand aucun écran précédent n'existe.
            if ((router as any).canGoBack?.()) {
              router.back();
            } else {
              router.replace('/(tabs)/home');
            }
          }}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.6)',
  },
  dividerText: {
    color: '#6b7280',
    fontSize: 12,
  },
  oauthButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(10,126,164,0.5)',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  oauthText: {
    color: '#0a7ea4',
    fontWeight: '600',
    fontSize: 15,
  },
  backButton: {
    alignItems: 'center',
  },
  backText: {
    color: '#1f2937',
  },
});
