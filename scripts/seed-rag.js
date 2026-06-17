#!/usr/bin/env node
/**
 * Seed du CADRE MÉTHODOLOGIQUE du RAG (chunks partagés, user_id = NULL).
 *
 * IMPORTANT : on ne seed PAS d'exemples de posts. Le modèle sait déjà écrire.
 * Le cadre sert uniquement de garde-fou méthodologique :
 *   - kind='method' : règles qui empêchent l'hallucination / forcent l'info vérifiée
 *   - kind='banned' : anti-patterns (clichés LinkedIn à ne jamais produire)
 *
 * La MÉMOIRE PERSO (kind='memory', par user_id) n'est PAS seedée ici : elle se
 * construit automatiquement à chaque post validé (rag.rememberPost dans le controller).
 *
 * Usage : node scripts/seed-rag.js   (idempotent : vide le cadre puis le réingère)
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const rag = require('../src/ia/rag/rag-service');
const { STRATEGIES } = require('../src/ia/strategies/strategy-registry');

// Règles méthodologiques communes (anti-hallucination, info vérifiée, ancrage date).
const METHOD_COMMON = [
  "N'affirme aucun fait précis (chiffre, date, étude, nom) sans que l'utilisateur l'ait fourni. Sinon reste sur le vécu et l'observation.",
  "Si une information factuelle est essentielle, formule-la prudemment et signale qu'elle mérite vérification, plutôt que de l'inventer.",
  "Référe-toi à la date du jour fournie pour tout élément temporel ; ne suppose pas une date par défaut.",
  "Reste fidèle au champ libre de l'utilisateur : développe SON idée, n'ajoute pas de thèmes qu'il n'a pas mentionnés.",
  "Voix : profonde et honnête, parfois cash, toujours incarnée (une vraie personne, pas un discours lisse).",
];

// Anti-patterns communs (le « bullshit LinkedIn »).
const BANNED_COMMON = [
  "Pas d'ouverture cliché : « j'ai eu une révélation », « et devinez quoi ? », « spoiler : », « accrochez-vous ».",
  "Pas de morale plaquée ni de slogan en fin de post, pas de « et vous, qu'en pensez-vous ? » mécanique.",
  "Pas de fausses statistiques ni de « selon une étude » sans source réelle.",
  "Pas de structure scolaire (listes à puces, « premièrement / deuxièmement », plan annoncé).",
  "Pas d'emojis en rafale ni de ton corporate vide (« ravi de partager », « game changer », « disruptif »).",
];

async function run() {
  console.log('🌱 Seed du CADRE méthodologique RAG (pas d\'exemples de posts)');
  const types = Object.values(STRATEGIES).map((s) => s.ragNamespace);
  const uniqueNamespaces = [...new Set(types)];
  let total = 0;

  for (const ns of uniqueNamespaces) {
    await rag.clearFramework(ns);
    const items = [
      ...METHOD_COMMON.map((content) => ({ namespace: ns, kind: 'method', content })),
      ...BANNED_COMMON.map((content) => ({ namespace: ns, kind: 'banned', content })),
    ];
    const n = await rag.ingestFramework(items);
    total += n;
    console.log(`  ✔ ${ns} : ${n} chunks de cadre (${METHOD_COMMON.length} method, ${BANNED_COMMON.length} banned)`);
  }

  console.log(`\n✅ Cadre seedé : ${total} chunks sur ${uniqueNamespaces.length} namespaces. La mémoire perso se construit ensuite automatiquement.`);
  process.exit(0);
}

run().catch((e) => {
  console.error('✖ Erreur seed RAG:', e.message);
  process.exit(1);
});
