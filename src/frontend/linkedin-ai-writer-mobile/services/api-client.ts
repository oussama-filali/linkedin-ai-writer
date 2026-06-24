import Constants from 'expo-constants';

// URL du backend en PRODUCTION (Render). Utilisée dans le build (.apk) et
// quand aucune URL de dev n'est détectée. C'est ce que joignent les testeurs.
const PROD_BASE_URL = 'https://linkedin-ai-writer.onrender.com/api';

// Fallback ultime (rare) : utilisé seulement si rien d'autre n'est trouvé.
const DEFAULT_BASE_URL = PROD_BASE_URL;

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function getDevBaseUrlFromExpo(): string | null {
  try {
    const anyConstants = Constants as any;
    const expoConfig = anyConstants.expoConfig ?? anyConstants.manifest ?? {};
    const extra = expoConfig.extra ?? {};

    // Si une URL est configurée explicitement dans extra, on la respecte
    if (typeof extra.apiBaseUrl === 'string' && extra.apiBaseUrl.length > 0) {
      return (extra.apiBaseUrl as string).replace(/\/$/, '');
    }

    // Sinon, on dérive automatiquement depuis l'URL du dev server Expo
    const hostUri: string | undefined = expoConfig.hostUri ?? expoConfig.debuggerHost;
    if (!hostUri) return null;

    const host = hostUri.split(':')[0];
    if (!host) return null;

    // Backend HTTP sur le même host, port 3000
    return `http://${host}:3000/api`;
  } catch {
    return null;
  }
}

function getBaseUrl() {
  const anyConstants = Constants as any;
  const manifestExtra = anyConstants.manifest?.extra;
  const expoExtra = anyConstants.expoConfig?.extra;

  const configured =
    (manifestExtra?.apiBaseUrl as string | undefined) ??
    (expoExtra?.apiBaseUrl as string | undefined) ??
    (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined);

  // 1) URL configurée explicitement (app.json extra.apiBaseUrl ou variable d'env).
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  // 2) En développement local (Expo Go), on dérive l'URL du dev server (localhost
  //    sur le même réseau). hostUri n'existe QUE quand on lance via Expo en dev.
  const devAuto = getDevBaseUrlFromExpo();
  if (devAuto) {
    return devAuto;
  }

  // 3) Sinon (build .apk de production) : on tape le backend Render en ligne.
  return DEFAULT_BASE_URL.replace(/\/$/, '');
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
