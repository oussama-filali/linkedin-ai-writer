import { request } from './api-client';

export interface AppUser {
  id: string;
  name: string;
  headline: string | null;
  email?: string;
  provider?: 'supabase' | 'google';
  lastSync: string;
}

export interface AuthSessionPayload {
  token: string;
  user: AppUser;
}

// ⚠️ DEPRECATED: Ces fonctions ne sont plus utilisées par l'authentification
// L'auth utilise maintenant directement Supabase (voir hooks/use-auth.ts)
// Garde ces fonctions si ton backend les utilise pour d'autres features

export async function syncSupabaseSession(accessToken: string) {
  return request<AuthSessionPayload>('/auth/supabase', {
    method: 'POST',
    body: {},
    token: accessToken,
  });
}

export async function fetchSessionProfile(token?: string | null) {
  return request<AppUser>('/auth/me', { token });
}

export async function revokeSession(token?: string | null) {
  return request('/auth/logout', {
    method: 'POST',
    token,
  });
}
