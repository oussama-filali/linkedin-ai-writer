import { request } from './api-client';

/**
 * Préférences utilisateur RÉELLEMENT utilisées dans l'app.
 * (Le rappel de publication se règle désormais sur l'écran résultat, pas ici :
 * on a donc retiré autoPost / notifyBefore / defaultSlot qui étaient des
 * préférences fantômes héritées de l'ancienne version.)
 */
export interface UserPreferences {
  pushEnabled: boolean;
  factCheckEnabled: boolean;
}

export async function getUserPreferences(token?: string | null) {
  return request<UserPreferences>('/users/preferences', { token });
}

export async function updateUserPreferences(
  patch: Partial<UserPreferences>,
  token?: string | null
) {
  return request<UserPreferences>('/users/preferences', {
    method: 'PATCH',
    body: patch,
    token,
  });
}
