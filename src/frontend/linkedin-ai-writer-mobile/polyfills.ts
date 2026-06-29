/**
 * Polyfills à charger TOUT EN HAUT de l'app (avant Supabase).
 *
 * Problème résolu : en React Native, `crypto.subtle.digest` (SHA-256) n'existe
 * pas. Sans lui, le SDK Supabase retombe sur PKCE en mode "plain", ce qui
 * casse l'échange OAuth → erreur "invalid flow state, no valid flow state found".
 *
 * Ici on fournit `crypto.subtle.digest('SHA-256', data)` via expo-crypto, pour
 * que Supabase passe en PKCE "s256" (sécurisé) et que le login LinkedIn marche.
 */
import * as ExpoCrypto from 'expo-crypto';

const g = globalThis as any;

if (!g.crypto) {
  g.crypto = {};
}

if (!g.crypto.subtle || typeof g.crypto.subtle.digest !== 'function') {
  g.crypto.subtle = {
    ...(g.crypto.subtle || {}),
    /**
     * subtle.digest via expo-crypto. On utilise ExpoCrypto.digest qui prend et
     * renvoie un ArrayBuffer (pas de conversion en chaîne → pas de corruption
     * binaire). C'est ce qu'attend exactement le SDK Supabase pour le PKCE s256.
     */
    digest: async (
      algorithm: string | { name: string },
      data: ArrayBuffer | ArrayBufferView
    ): Promise<ArrayBuffer> => {
      const algoName = typeof algorithm === 'string' ? algorithm : algorithm.name;

      const map: Record<string, ExpoCrypto.CryptoDigestAlgorithm> = {
        'SHA-1': ExpoCrypto.CryptoDigestAlgorithm.SHA1,
        'SHA-256': ExpoCrypto.CryptoDigestAlgorithm.SHA256,
        'SHA-384': ExpoCrypto.CryptoDigestAlgorithm.SHA384,
        'SHA-512': ExpoCrypto.CryptoDigestAlgorithm.SHA512,
      };
      const key = (algoName || 'SHA-256').toUpperCase();
      const algo = map[key] ?? ExpoCrypto.CryptoDigestAlgorithm.SHA256;

      // Normalise l'entrée : on COPIE les octets dans un ArrayBuffer neuf
      // (évite toute ambiguïté de type ArrayBufferLike/SharedArrayBuffer).
      const view: Uint8Array =
        data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : new Uint8Array((data as ArrayBufferView).buffer, (data as ArrayBufferView).byteOffset, (data as ArrayBufferView).byteLength);
      const copy = new Uint8Array(view.length);
      copy.set(view);

      // ExpoCrypto.digest : BufferSource -> ArrayBuffer (binaire, fiable).
      return ExpoCrypto.digest(algo, copy);
    },
  };
}
