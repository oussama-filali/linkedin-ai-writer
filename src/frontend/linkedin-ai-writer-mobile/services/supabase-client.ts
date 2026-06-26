import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const extra = Constants.expoConfig?.extra ?? (Constants as any).manifest?.extra ?? {};
const supabaseUrl = (extra?.supabase?.url as string | undefined) ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = (extra?.supabase?.anonKey as string | undefined) ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabase-client] Supabase URL ou clé anon manquante. Configure extra.supabase dans app.json ou les variables EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

/**
 * Adaptateur de stockage pour la session Supabase.
 * - Sur mobile natif : expo-secure-store (sécurisé, persistant).
 * - Sur le web : localStorage.
 * Indispensable pour que la session OAuth (LinkedIn) soit MÉMORISÉE après le
 * retour du navigateur (sinon on retombe sur la page de connexion).
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      return Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Stockage de la session (corrige le "on retombe au login" après OAuth).
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    // On PERSISTE la session : c'est ce qui maintient l'utilisateur connecté.
    persistSession: true,
    // PKCE : flux OAuth recommandé pour le mobile natif. Permet à
    // exchangeCodeForSession de fonctionner correctement au retour de LinkedIn.
    flowType: 'pkce',
    // En natif on capte le deep link nous-mêmes ; sur le web Supabase lit l'URL.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
