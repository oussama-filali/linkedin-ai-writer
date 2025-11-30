import Constants from 'expo-constants';

const DEFAULT_BASE_URL = 'http://localhost:3000/api';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function getBaseUrl() {
  const extra = (Constants as any).manifest?.extra;
  const configured = (extra?.apiBaseUrl as string | undefined) ?? process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE_URL;
  return configured.replace(/\/$/, '');
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, headers, signal } = options;
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  let finalBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] ?? 'application/json';
    finalBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: finalBody,
    signal,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error ?? data?.message ?? 'Requête impossible.';
    throw new Error(message);
  }

  if (data && typeof data === 'object' && 'success' in data) {
    if (data.success === false) {
      throw new Error(data.error ?? 'Requête rejetée.');
    }
    return (data.data ?? data) as T;
  }

  return data as T;
}
