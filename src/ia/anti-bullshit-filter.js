/**
 * Filtre anti-bullshit (garde-fou en code, gratuit, post-génération).
 *
 * Couche 1 de la double protection (l'autre étant les anti-exemples BANNED
 * injectés dans le prompt). Si un pattern cliché est détecté, le noyau régénère.
 *
 * Objectif : éliminer le « LinkedIn bullshit » — fausses révélations, morale
 * plaquée, faux chiffres, structure scolaire, emojis en rafale.
 */

// Patterns clichés interdits. Chaque entrée : { id, pattern, label }
const BANNED_PATTERNS = [
  { id: 'revelation', pattern: /\b(j'?ai eu une (révélation|épiphanie)|ça a (tout )?changé ma vie)\b/i, label: 'fausse révélation' },
  // "spoiler" sous toutes ses formes : "spoiler:", "Spoiler : non", "spoiler alert"
  { id: 'spoiler', pattern: /\bspoiler\s*(alert)?\s*[:….!]/i, label: 'spoiler racoleur' },
  { id: 'devinez', pattern: /\b(et )?devinez quoi|accrochez[- ]vous|attention,? ça va piquer|tenez[- ]vous bien\b/i, label: 'accroche racoleuse' },
  { id: 'voici_n_lecons', pattern: /\bvoici (les )?\d+\s+(leçons|raisons|erreurs|conseils|secrets|astuces)\b/i, label: 'liste « voici N leçons »' },
  // Morale plaquée : "voilà la leçon que j'en tire", "la leçon est simple", "ce que j'ai appris c'est"
  { id: 'morale_plaquee', pattern: /\b(voil[àa] (la|ma) leçon|la leçon (que j'en tire|est|à retenir)|la (vraie )?leçon ici|morale de l'histoire)\b/i, label: 'morale plaquée' },
  { id: 'liste_scolaire', pattern: /\b(premièrement|deuxièmement|troisièmement)\b/i, label: 'plan scolaire' },
  { id: 'corporate_vide', pattern: /\b(ravi de partager|c'?est avec une (immense|grande) fierté|game[- ]changer|disruptif|ça va vous bluffer)\b/i, label: 'ton corporate vide' },
  // Question rhétorique mécanique en fin de post
  { id: 'question_mecanique', pattern: /(et vous,?\s*(qu'?en pensez-vous|comment faites-vous)|qu'?en pensez-vous\s*\?)\s*$/im, label: 'question mécanique de fin' },
  // Fausses statistiques / études non sourcées
  { id: 'fausse_stat', pattern: /\b\d{1,3}\s*%\s*(des|de|d')\s*(entreprises|personnes|professionnels|gens|salariés)\b/i, label: 'statistique inventée' },
  { id: 'fausse_etude', pattern: /\b(selon une étude|une étude (montre|révèle|démontre|de)|d'?après une (étude|recherche)|(harvard|mit|stanford|mckinsey))\b/i, label: 'étude non sourcée' },
];

/**
 * Compte les emojis dans un texte.
 * @param {string} text
 * @returns {number}
 */
function countEmojis(text) {
  const matches = text.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu);
  return matches ? matches.length : 0;
}

/**
 * Analyse un post : repère les violations anti-bullshit.
 * @param {string} post
 * @returns {{ clean: boolean, violations: Array<{id:string,label:string}> }}
 */
function analyze(post) {
  const text = post || '';
  const violations = [];

  for (const { id, pattern, label } of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({ id, label });
    }
  }

  // Emojis en rafale : on tolère quelques emojis, on bloque l'excès.
  const emojiCount = countEmojis(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length || 1;
  if (emojiCount > 6 || emojiCount / wordCount > 0.08) {
    violations.push({ id: 'emoji_rafale', label: `emojis en rafale (${emojiCount})` });
  }

  return { clean: violations.length === 0, violations };
}

/**
 * Raccourci booléen.
 * @param {string} post
 * @returns {boolean}
 */
function isClean(post) {
  return analyze(post).clean;
}

module.exports = { analyze, isClean, BANNED_PATTERNS };
