const openai = require('../../config/openai');
const db = require('../../config/database');

/**
 * Service RAG (Retrieval-Augmented Generation) basé sur pgvector.
 *
 * Le RAG a 3 rôles :
 *   1. MÉMOIRE PERSO (par user_id) : on stocke les posts passés de l'utilisateur.
 *      À la génération, on récupère ses posts les plus proches du brief pour que
 *      le modèle écrive DANS SON STYLE / SON CONTEXTE -> personnalisation réelle.
 *   2. CADRE MÉTHODOLOGIQUE (user_id NULL, kind='method'/'banned') : règles
 *      partagées qui empêchent l'hallucination et l'info non vérifiée.
 *   3. ANCRAGE TEMPOREL : created_at (référence à la date pour les infos récentes).
 *
 * RGPD : la mémoire perso est isolée par user_id (filtrée en code, RLS en DB).
 */

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIM = 1536;

/**
 * Calcule l'embedding d'un texte.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function embed(text) {
  const input = (text || '').trim();
  if (!input) throw new Error('embed: texte vide');
  const response = await openai.embeddings.create({ model: EMBEDDING_MODEL, input });
  return response.data[0].embedding;
}

function toVectorLiteral(vec) {
  return `[${vec.join(',')}]`;
}

/**
 * RÔLE 1 — Récupère la mémoire perso : les posts passés de CET utilisateur,
 * les plus proches du brief (personnalisation).
 * @param {number} userId
 * @param {string} namespace - type de post
 * @param {string} query - brief
 * @param {number} [k=3]
 * @returns {Promise<Array<{content:string, created_at:Date, distance:number}>>}
 */
async function retrieveUserMemory(userId, namespace, query, k = 3) {
  if (!userId) return [];
  const queryVec = toVectorLiteral(await embed(query));
  const { rows } = await db.query(
    `SELECT content, created_at, embedding <=> $1 AS distance
     FROM rag_chunks
     WHERE user_id = $2 AND namespace = $3 AND kind = 'memory'
     ORDER BY embedding <=> $1
     LIMIT $4`,
    [queryVec, userId, namespace, k]
  );
  return rows;
}

/**
 * RÔLE 2 — Récupère le cadre méthodologique partagé (règles + anti-patterns).
 * Volume volontairement petit : on prend tout (pas de recherche vectorielle).
 * @param {string} namespace
 * @returns {Promise<{method:string[], banned:string[]}>}
 */
async function retrieveFramework(namespace) {
  const { rows } = await db.query(
    `SELECT kind, content FROM rag_chunks
     WHERE user_id IS NULL AND namespace = $1 AND kind IN ('method','banned')
     ORDER BY kind, id`,
    [namespace]
  );
  return {
    method: rows.filter((r) => r.kind === 'method').map((r) => r.content),
    banned: rows.filter((r) => r.kind === 'banned').map((r) => r.content),
  };
}

/**
 * Assemble tout le contexte RAG pour une génération.
 * @param {object} params
 * @param {number} [params.userId]
 * @param {string} params.namespace
 * @param {string} params.query
 * @param {number} [params.k]
 * @returns {Promise<{memory:Array, method:string[], banned:string[]}>}
 */
async function getContext({ userId, namespace, query, k = 3 }) {
  const [memory, framework] = await Promise.all([
    retrieveUserMemory(userId, namespace, query, k),
    retrieveFramework(namespace),
  ]);
  return { memory, method: framework.method, banned: framework.banned };
}

/**
 * RÔLE 1 (écriture) — Mémorise un post validé comme nouvelle mémoire de l'utilisateur.
 * Appelé APRÈS génération + fact-check, pour que le modèle apprenne au fil de l'eau.
 * @param {object} params
 * @param {number} params.userId
 * @param {string} params.namespace - type de post
 * @param {string} params.content - le post validé
 * @param {object} [params.metadata]
 * @returns {Promise<void>}
 */
async function rememberPost({ userId, namespace, content, metadata = {} }) {
  if (!userId || !content) return; // pas de mémoire sans utilisateur identifié
  const vec = toVectorLiteral(await embed(content));
  await db.query(
    `INSERT INTO rag_chunks (user_id, namespace, kind, content, embedding, metadata)
     VALUES ($1, $2, 'memory', $3, $4, $5)`,
    [userId, namespace, content, vec, JSON.stringify(metadata)]
  );
}

/**
 * Insère des chunks de CADRE méthodologique (user_id NULL). Utilisé par le seed.
 * @param {Array<{namespace:string, kind:string, content:string}>} items
 * @returns {Promise<number>}
 */
async function ingestFramework(items) {
  let n = 0;
  for (const { namespace, kind, content } of items) {
    const vec = toVectorLiteral(await embed(content));
    await db.query(
      `INSERT INTO rag_chunks (user_id, namespace, kind, content, embedding)
       VALUES (NULL, $1, $2, $3, $4)`,
      [namespace, kind, content, vec]
    );
    n += 1;
  }
  return n;
}

/**
 * Vide le cadre méthodologique d'un namespace (re-seed propre).
 * Ne touche PAS à la mémoire perso des utilisateurs.
 * @param {string} namespace
 */
async function clearFramework(namespace) {
  await db.query(
    `DELETE FROM rag_chunks WHERE user_id IS NULL AND namespace = $1 AND kind IN ('method','banned')`,
    [namespace]
  );
}

module.exports = {
  EMBEDDING_MODEL,
  EMBEDDING_DIM,
  embed,
  retrieveUserMemory,
  retrieveFramework,
  getContext,
  rememberPost,
  ingestFramework,
  clearFramework,
};
