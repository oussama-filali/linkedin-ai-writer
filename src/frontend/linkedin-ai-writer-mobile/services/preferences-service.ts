import { request } from './api-client';

export interface UserPreferences {
  pushEnabled: boolean;
  autoPostEnabled: boolean;
  factCheckEnabled: boolean;
  notifyBeforeDefault: boolean;
  defaultSlot?: string | null;
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
