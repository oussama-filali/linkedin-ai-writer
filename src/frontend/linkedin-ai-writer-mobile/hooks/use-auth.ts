import { useCallback, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';

import type { AppUser } from '@/services/auth-service';
import { supabase } from '@/services/supabase-client';

const ACCESS_TOKEN_KEY = 'linkedin-ai-sb-access-token';
const REFRESH_TOKEN_KEY = 'linkedin-ai-sb-refresh-token';

type AuthState = {
  checkingSession: boolean;
  authenticating: boolean;
  user: AppUser | null;
  token: string | null;
};

async function storageIsAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

const storage = {
  async get(key: string) {
    return (await storageIsAvailable()) ? SecureStore.getItemAsync(key) : null;
  },
  async set(key: string, value: string) {
    if (await storageIsAvailable()) {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async remove(key: string) {
    if (await storageIsAvailable()) {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

async function persistSessionTokens(accessToken: string, refreshToken?: string | null) {
  await storage.set(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await storage.set(REFRESH_TOKEN_KEY, refreshToken);
  }
}

async function clearStoredSession() {
  await storage.remove(ACCESS_TOKEN_KEY);
  await storage.remove(REFRESH_TOKEN_KEY);
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    checkingSession: true,
    authenticating: false,
    user: null,
    token: null,
  });
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback(async (accessToken: string, supabaseUser: any) => {
    // Utilisation directe de Supabase sans appel backend
    const user: AppUser = {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Utilisateur',
      headline: supabaseUser.user_metadata?.headline || null,
      email: supabaseUser.email,
      provider: 'supabase',
      lastSync: new Date().toISOString(),
    };
    
    console.log('✅ Session appliquée:', { userId: user.id, email: user.email, token: accessToken.substring(0, 20) + '...' });
    
    setState({
      checkingSession: false,
      authenticating: false,
      token: accessToken,
      user,
    });
    return user;
  }, []);

  const hydrateFromStorage = useCallback(async () => {
    setState((prev) => ({ ...prev, checkingSession: true }));
    setError(null);

    try {
      const accessToken = await storage.get(ACCESS_TOKEN_KEY);
      const refreshToken = await storage.get(REFRESH_TOKEN_KEY);

      if (!accessToken || !refreshToken) {
        setState({ checkingSession: false, authenticating: false, user: null, token: null });
        return;
      }

      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError || !data.session) {
        throw sessionError ?? new Error('Session Supabase invalide');
      }

      await persistSessionTokens(data.session.access_token, data.session.refresh_token);
      await applySession(data.session.access_token, data.user);
    } catch (err) {
      console.warn('Synchronisation de session impossible', err);
      await clearStoredSession();
      setState({ checkingSession: false, authenticating: false, user: null, token: null });
    }
  }, [applySession]);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    type AuthListener = Parameters<typeof supabase.auth.onAuthStateChange>[0];
    type AuthEvent = Parameters<AuthListener>[0];
    type AuthSession = Parameters<AuthListener>[1];

    const handler = (_event: AuthEvent, session: AuthSession) => {
      if (session?.access_token) {
        persistSessionTokens(session.access_token, session.refresh_token).catch((err) =>
          console.warn('Impossible de persister la session Supabase', err)
        );
        setState((prev) => ({ ...prev, token: session.access_token }));
      }

      if (!session) {
        clearStoredSession().catch(() => undefined);
        setState({ checkingSession: false, authenticating: false, user: null, token: null });
      }
    };

    const { data: subscription } = supabase.auth.onAuthStateChange(handler);

    return () => {
      subscription.subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setState((prev) => ({ ...prev, authenticating: true }));

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.session) {
        throw signInError ?? new Error('Connexion Supabase impossible');
      }

      await persistSessionTokens(data.session.access_token, data.session.refresh_token);
      await applySession(data.session.access_token, data.user);
    } catch (err) {
      console.error('Auth login failed', err);
      setError(err instanceof Error ? err.message : 'Connexion impossible, réessaie.');
      setState({ checkingSession: false, authenticating: false, user: null, token: null });
      throw err;
    }
  }, [applySession]);

  const register = useCallback(async (email: string, password: string) => {
    setError(null);
    setState((prev) => ({ ...prev, authenticating: true }));

    try {
      const redirectUrl = Linking.createURL('/auth/callback');
      console.log('Supabase Redirect URL:', redirectUrl);

      const { data, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: redirectUrl,
        }
      });
      if (signUpError) {
        throw signUpError;
      }
// ...existing code...

      if (!data.session) {
        setState({ checkingSession: false, authenticating: false, user: null, token: null });
        setError('Compte créé. Vérifie ta boîte mail pour valider ton inscription.');
        return { needsConfirmation: true };
      }

      await persistSessionTokens(data.session.access_token, data.session.refresh_token);
      const user = await applySession(data.session.access_token, data.user);
      return { needsConfirmation: false, user };
    } catch (err) {
      console.error('Auth signup failed', err);
      setError(err instanceof Error ? err.message : "Inscription impossible, réessaie.");
      setState({ checkingSession: false, authenticating: false, user: null, token: null });
      throw err;
    }
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Déconnexion Supabase impossible', err);
    } finally {
      await clearStoredSession();
      setState({ checkingSession: false, authenticating: false, user: null, token: null });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!state.token) {
      return;
    }
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        const user: AppUser = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Utilisateur',
          headline: supabaseUser.user_metadata?.headline || null,
          email: supabaseUser.email,
          provider: 'supabase',
          lastSync: new Date().toISOString(),
        };
        setState((prev) => ({ ...prev, user }));
      }
    } catch (err) {
      console.warn('Impossible de rafraîchir le profil', err);
    }
  }, [state.token]);

  const authHelpers = useMemo(
    () => ({
      isAuthenticated: Boolean(state.user),
      checkingSession: state.checkingSession,
      authenticating: state.authenticating,
    }),
    [state.authenticating, state.checkingSession, state.user]
  );

  return {
    ...authHelpers,
    user: state.user,
    token: state.token,
    error,
    login,
    register,
    logout,
    refresh: hydrateFromStorage,
    refreshProfile,
  };
}
