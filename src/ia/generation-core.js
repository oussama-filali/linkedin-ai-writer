const openai = require('../config/openai');
const { getStrategy } = require('./strategies/strategy-registry');
const rag = require('./rag/rag-service');
const antiBullshit = require('./anti-bullshit-filter');

/**
 * NOYAU de génération unifié (le centre de l'entonnoir).
 *
 * Le modèle SAIT déjà écrire comme un humain de chaque métier : on ne lui donne
 * pas d'exemples. On lui donne :
 *   - une VOIX (instructions de stratégie : profond, cash, incarné)
 *   - sa MÉMOIRE PERSO (posts passés de l'utilisateur via user_id -> personnalisation)
 *   - un CADRE méthodologique (anti-hallucination, info vérifiée)
 *   - la DATE du jour (ancrage temporel pour les infos récentes)
 *
 * Flux :
 *   1. getStrategy(type)
 *   2. rag.getContext({userId,...}) -> mémoire perso + cadre
 *   3. UN appel OpenAI
 *   4. anti-bullshit filter -> régénère si cliché
 */

// Modèle performant. Configurable via .env (GENERATION_MODEL).
const MODEL = process.env.GENERATION_MODEL || 'gpt-4o';
const MAX_REGEN = 2;

/**
 * Profil minimal (RGPD : pas de données identifiantes brutes).
 */
function buildProfileLine(profile) {
  if (!profile) return '';
  if (typeof profile === 'string') return profile.trim();
  const parts = [];
  if (profile.role) parts.push(profile.role);
  if (profile.experienceLevel) parts.push(profile.experienceLevel);
  if (profile.sector) parts.push(`secteur ${profile.sector}`);
  if (profile.targetAudience) parts.push(`s'adresse à ${profile.targetAudience}`);
  return parts.join(', ');
}

/**
 * Date du jour en français (ancrage temporel).
 */
function todayLine() {
  const d = new Date();
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Détecte si le brief demande des faits / études / sources / chiffres.
 * Sert à renforcer le garde-fou anti-invention (on ne fabrique JAMAIS de source).
 * @param {string} brief
 * @returns {boolean}
 */
function asksForSources(brief) {
  if (!brief) return false;
  const re = /\b(source|sources|étude|études|etude|etudes|recherche|académique|academique|statistique|stats?|chiffres?|données|donnees|preuve|preuves|référence|reference|citer|cite|fait scientifique)\b/i;
  return re.test(brief);
}

/**
 * Instruction de garde-fou quand l'utilisateur réclame des sources/faits.
 * On ne laisse JAMAIS le modèle inventer une étude ou une statistique.
 */
const SOURCES_GUARD = `IMPORTANT — DEMANDE DE SOURCES/FAITS DÉTECTÉE :
L'utilisateur demande des faits, études ou sources. Tu n'as PAS accès à une base
de sources vérifiables. Donc :
- N'INVENTE AUCUNE étude, statistique, chiffre, date ou nom d'auteur. Jamais.
- Si tu ne disposes pas d'une source réelle et vérifiable, dis-le clairement et
  honnêtement dans le post (par ex. "je n'ai pas de chiffre précis à citer ici"),
  ou reformule en t'appuyant sur l'expérience vécue ("d'après ce que j'observe").
- Mieux vaut un post honnête sans source qu'un post avec une fausse source.`;

/**
 * Assemble le user prompt : brief + profil + mémoire perso + cadre + date.
 * PAS d'exemples imposés : la mémoire perso sert à personnaliser le style.
 */
function buildUserPrompt({ strategy, brief, profileLine, comment, memory, method, banned }) {
  const sections = [];

  sections.push(`DATE DU JOUR : ${todayLine()}. Si tu évoques un fait daté, base-toi sur cette date.`);

  if (profileLine) sections.push(`QUI PARLE : ${profileLine}.`);

  if (comment && strategy.needsComment) {
    sections.push(`COMMENTAIRE À RÉPONDRE :\n"${comment}"`);
  }

  sections.push(`CE QUE LA PERSONNE VEUT DIRE (champ libre) :\n${brief}`);

  // Mémoire perso : on montre comment CET utilisateur écrit d'habitude (style, contexte),
  // sans copier le contenu. C'est ça la personnalisation par user_id.
  if (memory && memory.length) {
    const samples = memory.map((m, i) => `- ${m.content}`).join('\n');
    sections.push(
      `MÉMOIRE DE CETTE PERSONNE (ses posts passés — calque son STYLE, son vocabulaire et son ton, ne recopie pas le contenu) :\n${samples}`
    );
  }

  if (method && method.length) {
    sections.push(`MÉTHODE À RESPECTER :\n- ${method.join('\n- ')}`);
  }

  if (banned && banned.length) {
    sections.push(`À NE JAMAIS FAIRE :\n- ${banned.join('\n- ')}`);
  }

  sections.push(
    `Écris UN seul ${strategy.label.toLowerCase()} LinkedIn, directement publiable, sans titre ni explication autour. ` +
    `Voix : profonde, honnête (parfois cash), incarnée. Aucune info inventée. Pas de bullshit.`
  );

  return sections.join('\n\n');
}

/**
 * Génère un post via le noyau unifié.
 * @param {object} input
 * @param {string} input.type
 * @param {string} input.brief
 * @param {object|string} [input.profile]
 * @param {string} [input.comment]
 * @param {number} [input.userId] - pour la mémoire perso
 * @returns {Promise<{post:string, type:string, regenerated:number, bullshitViolations:Array, usedMemory:number}>}
 */
async function generate({ type, brief, profile, comment, userId }) {
  if (!brief || !brief.trim()) throw new Error('Brief manquant pour la génération');

  const strategy = getStrategy(type);
  const profileLine = buildProfileLine(profile);

  // Contexte RAG : mémoire perso (par user_id) + cadre méthodologique partagé.
  const { memory, method, banned } = await rag.getContext({
    userId,
    namespace: strategy.ragNamespace,
    query: brief,
    k: 3,
  });

  const userPrompt = buildUserPrompt({ strategy, brief, profileLine, comment, memory, method, banned });

  // Si l'utilisateur demande des sources/faits : garde-fou anti-invention.
  const needsSourcesGuard = asksForSources(brief);
  const baseSystem = needsSourcesGuard
    ? `${strategy.systemInstructions}\n\n${SOURCES_GUARD}`
    : strategy.systemInstructions;

  let lastPost = '';
  let lastViolations = [];

  for (let attempt = 0; attempt <= MAX_REGEN; attempt++) {
    const systemPrompt =
      attempt === 0
        ? baseSystem
        : `${baseSystem}\n\nATTENTION : la version précédente contenait des clichés interdits (${lastViolations
            .map((v) => v.label)
            .join(', ')}). Réécris SANS aucun de ces travers.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: strategy.maxTokens || 500,
      presence_penalty: 0.5,
      frequency_penalty: 0.4,
    });

    lastPost = response.choices[0].message.content.trim();
    const check = antiBullshit.analyze(lastPost);

    if (check.clean) {
      return { post: lastPost, type, regenerated: attempt, bullshitViolations: [], usedMemory: memory.length };
    }
    lastViolations = check.violations;
    console.warn(
      `⚠️  Anti-bullshit (essai ${attempt + 1}/${MAX_REGEN + 1}) : ${check.violations.map((v) => v.label).join(', ')}`
    );
  }

  return { post: lastPost, type, regenerated: MAX_REGEN + 1, bullshitViolations: lastViolations, usedMemory: memory.length };
}

/**
 * Améliore un post existant selon un feedback utilisateur, en gardant la voix.
 * Remplace l'ancien ai-service.improvePost.
 * @param {string} originalPost
 * @param {string} feedback
 * @returns {Promise<string>}
 */
async function improve(originalPost, feedback) {
  const systemPrompt =
    `Tu réécris un post LinkedIn en intégrant le retour de l'utilisateur, ` +
    `tout en gardant la même voix : profonde, honnête (parfois cash), incarnée. ` +
    `Pas de bullshit, pas de morale plaquée, pas de structure scolaire, aucune info inventée.`;

  const userPrompt =
    `POST ACTUEL :\n${originalPost}\n\nRETOUR DE L'UTILISATEUR :\n${feedback}\n\n` +
    `Réécris le post en tenant compte de ce retour. Réponds UNIQUEMENT par le post final.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  return response.choices[0].message.content.trim();
}

module.exports = { generate, improve, buildUserPrompt, buildProfileLine, MODEL };
