/**
 * Extraction des SOURCES réelles à partir d'un résultat de fact-checking.
 *
 * Le fact-checker (fact-checker.js) interroge Google Fact Check + Wikidata et
 * attache à chaque claim des URLs réelles. Ce module les agrège proprement pour
 * la réponse API : toute info factuelle conservée doit être sourçable.
 */

/**
 * Extrait la liste des sources (URLs réelles) d'un résultat de fact-check.
 * @param {object} factCheckResult - sortie de fact-checker.verifySafeToPublish
 * @returns {Array<{ claim:string, source:string, url:string, rating?:string }>}
 */
function extractSources(factCheckResult) {
  const claims = factCheckResult?.analysis?.claims;
  if (!Array.isArray(claims)) return [];

  const sources = [];
  for (const claim of claims) {
    // Source Google Fact Check (vraie URL + éditeur)
    const g = claim.googleFactCheck;
    if (g?.available && g.url) {
      sources.push({
        claim: claim.text,
        source: g.source || 'Google Fact Check',
        url: g.url,
        rating: g.rating || undefined,
      });
    }
    // Sources Wikidata (entités avec URL)
    const entities = claim.wikidataCheck?.entities;
    if (Array.isArray(entities)) {
      for (const e of entities) {
        if (e.url) {
          sources.push({ claim: claim.text, source: `Wikidata: ${e.label}`, url: e.url });
        }
      }
    }
  }
  return sources;
}

/**
 * Indique si un post contient au moins une claim factuelle NON sourcée.
 * Sert à décider s'il faut alerter l'utilisateur (info sans source).
 * @param {object} factCheckResult
 * @returns {boolean}
 */
function hasUnsourcedClaims(factCheckResult) {
  const claims = factCheckResult?.analysis?.claims;
  if (!Array.isArray(claims) || claims.length === 0) return false;

  return claims.some((c) => {
    const hasGoogle = c.googleFactCheck?.url;
    const hasWiki = Array.isArray(c.wikidataCheck?.entities) && c.wikidataCheck.entities.some((e) => e.url);
    return !hasGoogle && !hasWiki;
  });
}

module.exports = { extractSources, hasUnsourcedClaims };
