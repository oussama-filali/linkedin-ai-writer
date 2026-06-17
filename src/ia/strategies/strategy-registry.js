/**
 * Registre des stratégies de génération (cœur de l'entonnoir).
 *
 * Chaque TYPE de post choisi par l'utilisateur est branché à une stratégie.
 * Une stratégie définit :
 *   - la voix / les instructions spécifiques au type
 *   - le namespace RAG associé (où chercher les exemples GOLD/BANNED/STYLE)
 *   - si le type nécessite des sources factuelles (déclenche la recherche web)
 *   - le plafond de tokens (optimisation coût)
 *
 * On ne change JAMAIS le noyau de génération : on ne change que ce qu'on lui
 * injecte (instructions + contexte RAG). C'est ça l'entonnoir.
 */

// Socle de voix commun à tous les types : pro mais hyper humain, zéro cliché.
// Centralisé ici pour que toutes les stratégies en héritent.
const VOICE_BASE = `Tu écris des posts LinkedIn comme une vraie personne, pas comme un robot ni comme un "influenceur" qui récite des recettes.

Ton style :
- Pro mais profondément humain : on doit sentir une vraie personne, avec de l'émotion, parfois de l'humour, de l'autodérision.
- Phrases de longueur variable. Certaines longues, d'autres très courtes. Du rythme.
- Une oralité assumée : on peut commencer une phrase par "Et", "Mais", "Bref".
- Concret et spécifique au profil et au secteur. Jamais générique.

INTERDIT ABSOLU (anti-bullshit) :
- Pas de "j'ai eu une révélation", "et devinez quoi ?", "spoiler :", "voici 3 leçons".
- Pas de morale plaquée à la fin, pas de slogan, pas de call-to-action marketing.
- Pas de fausses statistiques, fausses études, faux chiffres, faux noms d'entreprise.
- Pas d'emojis en rafale. Maximum quelques-uns, et seulement s'ils sont naturels.
- Pas de listes à puces ou de plans scolaires ("Premièrement... Deuxièmement...").

Anti-hallucination : n'invente JAMAIS de fait précis. Si tu n'as pas l'information,
reste sur le vécu : "d'après mon expérience", "ce que je vois au quotidien", "j'ai remarqué que".`;

const STRATEGIES = {
  storytelling: {
    label: 'Storytelling',
    ragNamespace: 'storytelling',
    requiresSources: false,
    maxTokens: 500,
    systemInstructions: `${VOICE_BASE}

TYPE : STORYTELLING.
- Pars d'un moment précis, concret, vécu (pas d'une théorie générale).
- Montre les doutes, les hésitations, les ratés, pas seulement la réussite.
- Une ou deux idées fortes, pas dix. Laisse de l'espace.
- Termine de façon naturelle (une question sincère ou une ouverture), jamais par une leçon donnée de haut.`,
  },

  performance: {
    label: 'Performance / accroche',
    ragNamespace: 'performance',
    requiresSources: false,
    maxTokens: 500,
    systemInstructions: `${VOICE_BASE}

TYPE : PERFORMANCE / ACCROCHE.
- La première ligne doit donner envie de lire la suite, sans être racoleuse ni "clickbait".
- Va droit au but : pas d'introduction qui tourne autour du pot.
- Garde de la densité : chaque phrase apporte quelque chose.
- L'engagement vient de la sincérité et de la précision, pas d'un appel forcé à commenter.`,
  },

  reponse_commentaire: {
    label: 'Réponse à un commentaire',
    ragNamespace: 'reponse_commentaire',
    requiresSources: false,
    maxTokens: 350,
    needsComment: true,
    systemInstructions: `${VOICE_BASE}

TYPE : RÉPONSE À UN COMMENTAIRE.
- On te fournit le commentaire reçu. Tu écris UNE réponse à ce commentaire.
- Reste court, direct, humain. Réagis vraiment à ce qui est dit, ne récite pas un discours.
- Si le commentaire est critique, réponds avec calme et ouverture, sans agressivité ni flatterie.
- Pas de pavé : une réponse de conversation, pas un nouveau post.`,
  },

  conseil: {
    label: 'Partage d\'expertise / conseil',
    ragNamespace: 'conseil',
    requiresSources: true, // un conseil s'appuie parfois sur un fait → on veut pouvoir sourcer
    maxTokens: 500,
    systemInstructions: `${VOICE_BASE}

TYPE : PARTAGE D'EXPERTISE / CONSEIL.
- Donne UN conseil concret, applicable, tiré de l'expérience du profil.
- Explique pourquoi, avec un exemple réel et situé (pas une généralité).
- Si tu mentionnes un fait vérifiable, il devra être sourcé : reste prudent, ne lance pas de chiffre au hasard.
- Pas de ton donneur de leçons : tu partages ce qui marche pour toi, pas une vérité universelle.`,
  },
};

const DEFAULT_TYPE = 'storytelling';

/**
 * Récupère la stratégie d'un type donné, avec fallback sûr.
 * @param {string} type
 * @returns {object} stratégie
 */
function getStrategy(type) {
  return STRATEGIES[type] || STRATEGIES[DEFAULT_TYPE];
}

/**
 * Vérifie qu'un type est connu.
 * @param {string} type
 * @returns {boolean}
 */
function isValidType(type) {
  return Object.prototype.hasOwnProperty.call(STRATEGIES, type);
}

/**
 * Liste les types exposables au frontend (id + label).
 * @returns {Array<{ type: string, label: string, needsComment: boolean }>}
 */
function listTypes() {
  return Object.entries(STRATEGIES).map(([type, s]) => ({
    type,
    label: s.label,
    needsComment: Boolean(s.needsComment),
  }));
}

module.exports = {
  STRATEGIES,
  DEFAULT_TYPE,
  getStrategy,
  isValidType,
  listTypes,
};
