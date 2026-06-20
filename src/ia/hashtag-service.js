const openai = require('../config/openai');

/**
 * Service de hashtags et de mots-clés.
 *
 * Rôle :
 *   1. Détecter les mots-clés significatifs d'un post (analyse locale, sans tokens).
 *   2. Générer 3 à 5 hashtags PERTINENTS et STRATÉGIQUES via l'IA, cohérents
 *      avec le sujet réel du post (objectif : toucher la bonne audience).
 *   3. Préserver les hashtags que l'utilisateur a déjà écrits dans son post.
 *
 * Les hashtags sont importants pour l'audience : on les génère donc par IA
 * (compréhension du sujet) plutôt que par simple fréquence de mots.
 */

const MODEL = process.env.HASHTAG_MODEL || 'gpt-4o-mini'; // petit modèle = coût minime

// Mots vides français à ignorer pour la détection locale de mots-clés.
const STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'au', 'aux', 'et', 'ou', 'mais',
  'donc', 'car', 'ni', 'que', 'qui', 'quoi', 'dont', 'où', 'à', 'dans', 'sur', 'sous',
  'avec', 'sans', 'pour', 'en', 'vers', 'chez', 'ce', 'cet', 'cette', 'ces',
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'votre', 'leur',
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se',
  'est', 'sont', 'était', 'être', 'avoir', 'fait', 'faire', 'plus', 'moins', 'très',
  'pas', 'ne', 'non', 'oui', 'comme', 'aussi', 'alors', 'puis', 'déjà', 'encore',
  'tout', 'tous', 'toute', 'toutes', 'rien', 'bien', 'peu', 'beaucoup', 'trop',
  'cela', 'ça', 'celui', 'celle', 'leurs', 'quand', 'parce', 'avant', 'après', 'pendant',
  'bosse', 'mois', 'dernier', 'jour', 'fois', 'chose', 'truc', 'gens',
]);

/**
 * Détecte les mots-clés significatifs d'un texte par fréquence (analyse locale).
 * Sert de SIGNAL au générateur de hashtags (pas affiché tel quel).
 * @param {string} text
 * @param {number} [max=8]
 * @returns {string[]}
 */
function extractKeywords(text, max = 8) {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/#[\wàâäéèêëïîôöùûüç]+/gi, ' ')
    .replace(/[^a-zàâäéèêëïîôöùûüç\s-]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

/**
 * Extrait les hashtags déjà présents dans un texte (#MotClé).
 * @param {string} text
 * @returns {string[]}
 */
function extractExistingHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#[\wàâäéèêëïîôöùûüç]+/gi) || [];
  return [...new Set(matches)];
}

/**
 * Génère 3 à 5 hashtags pertinents et stratégiques via l'IA.
 * - Les hashtags déjà écrits par l'utilisateur dans le post sont conservés en priorité.
 * - L'IA complète avec des hashtags cohérents au sujet, pour la portée.
 * @param {string} post - le texte du post
 * @param {object} [context] - contexte optionnel { secteur, sujet }
 * @returns {Promise<{ keywords: string[], hashtags: string[] }>}
 */
async function buildHashtags(post, context = {}) {
  const keywords = extractKeywords(post);
  const existing = extractExistingHashtags(post);

  // Si l'utilisateur a déjà mis 5 hashtags, on n'appelle pas l'IA.
  if (existing.length >= 5) {
    return { keywords, hashtags: existing.slice(0, 5) };
  }

  let aiHashtags = [];
  try {
    const prompt =
      `Voici un post LinkedIn :\n"""\n${post}\n"""\n` +
      (context.secteur ? `Secteur : ${context.secteur}.\n` : '') +
      `Propose entre 3 et 5 hashtags PERTINENTS et stratégiques pour maximiser la portée auprès de la bonne audience. ` +
      `Ils doivent coller au sujet réel du post. Mélange 1-2 hashtags larges (forte audience) et 2-3 hashtags de niche (ciblés). ` +
      `Réponds UNIQUEMENT en JSON : { "hashtags": ["#Exemple", ...] }`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'Tu es un expert LinkedIn qui choisit des hashtags efficaces pour la portée. Pas de hashtags génériques inutiles.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 100,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    aiHashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
  } catch (err) {
    // Non bloquant : si l'IA échoue, on retombe sur les hashtags existants.
    console.warn('⚠️  Génération hashtags IA échouée (non bloquant):', err.message);
  }

  // Fusion : hashtags de l'utilisateur d'abord, puis ceux de l'IA, sans doublon.
  const seen = new Set(existing.map((h) => h.toLowerCase()));
  const hashtags = [...existing];
  for (const h of aiHashtags) {
    if (hashtags.length >= 5) break;
    const clean = h.startsWith('#') ? h : `#${h}`;
    if (!seen.has(clean.toLowerCase())) {
      hashtags.push(clean);
      seen.add(clean.toLowerCase());
    }
  }

  return { keywords, hashtags: hashtags.slice(0, 5) };
}

module.exports = {
  extractKeywords,
  extractExistingHashtags,
  buildHashtags,
};
