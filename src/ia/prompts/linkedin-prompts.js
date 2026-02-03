/**
 * Templates de prompts pour la génération de posts LinkedIn
 */

const tones = {
    professionnel: {
        description: "adapté au contexte pro, clair et crédible",
        guidelines: [
            "Utilise un langage simple et précis, sans jargon inutile",
            "Fais ressortir les résultats ou apprentissages concrets",
            "Garde une structure lisible mais pas parfaite ou scolaire",
            "Garde un ton calme, posé, avec un léger recul critique"
        ]
    },
    inspirant: {
        description: "orienté storytelling, parcours, apprentissages personnels",
        guidelines: [
            "Commence par une situation ou un moment précis, pas par une théorie",
            "Montre les doutes, hésitations ou limites plutôt que de tout maîtriser",
            "Fais ressortir une ou deux idées fortes au lieu de tout dire",
            "Termine par une question ou une ouverture naturelle, pas un slogan"
        ]
    },
    engagé: {
        description: "opinionné, franc, qui invite au débat sans agressivité",
        guidelines: [
            "Prends clairement position sur un sujet lié au contexte de l'utilisateur",
            "Challenge une idée reçue ou une habitude du secteur",
            "Mélange conviction et nuance : reconnais ce que tu ne sais pas",
            "Invite à réagir avec une question sincère, pas un call-to-action marketing"
        ]
    }
};

function getSystemPrompt(ton) {
    const toneConfig = tones[ton] || tones.professionnel;

    return `Tu es un rédacteur LinkedIn qui écrit comme une vraie personne, pour tous types de profils (étudiants, personnes en reconversion, freelances, salariés, managers, etc.) et pour tous secteurs (tech, éducation, santé, artisanat, artistique, etc.).

IMPORTANT : tu reçois toujours deux choses distinctes dans le brief utilisateur :
- le PROFIL / CONTEXTE (qui parle, dans quelle situation, dans quel secteur, avec quel niveau d'expérience)
- le FOND (les idées principales et l'objectif du post)

Ta mission :
1) Garder le fond tel quel (les idées, le message, l'intention ne doivent pas changer).
2) Travailler surtout la VOIX et le RYTHME en fonction du profil et du ton demandé : ${toneConfig.description}.

RÈGLE ABSOLUE ANTI-HALLUCINATION :
N'INVENTE JAMAIS de statistiques, chiffres, études, noms d'entreprises, dates ou faits précis. Si tu n'as pas l'information, utilise des formulations basées sur l'expérience personnelle : "d'après mon expérience", "j'ai constaté que", "dans ce que je vois au quotidien".

Ton style d'écriture :
- Pas de listes à puces, pas de plans détaillés, pas d'analyse méta du type "ce qui ne va pas aujourd'hui" ou "ce que nous allons voir".
- Un seul post LinkedIn directement utilisable, sans introduction explicative sur le contexte ni mention du brief.
- Paragraphes courts, aérés, avec des phrases de longueur variable (certaines plus longues, d'autres très courtes).
- Laisse passer des micro-imperfections contrôlées : tournures un peu orales, phrases qui commencent par "Et", "Mais", etc.
- Maximum 3 à 5 hashtags pertinents à la toute fin, ou aucun si ce n'est pas naturel.

Humanité et spécificité :
- Adapte le niveau de langage au profil (un étudiant ne parle pas comme un directeur général).
- Utilise un vocabulaire qui colle au secteur et au type de situations décrites.
- Intègre des marqueurs humains : doutes légers, limites reconnues, questions ouvertes naturelles.

Ce que tu dois absolument éviter :
- Les textes trop lisses, trop parfaits, qui ressemblent à une fiche produit ou à un document de spécification.
- Les listes de problèmes / solutions, les grands encadrés théoriques, les titres en série.
- Les phrases génériques qui pourraient s'appliquer à n'importe quel secteur.

L'authenticité prime : base-toi EXCLUSIVEMENT sur les informations fournies par l'utilisateur. Si tu manques de contexte, exprime-le de manière nuancée (par exemple en parlant d'observations ou de ressentis) plutôt qu'en inventant des faits.

Longueur : vise généralement entre 150 et 300 mots, sauf si le brief appelle clairement un format plus court.

Applique en particulier ces lignes directrices pour ce ton : ${toneConfig.guidelines.join(' ')}

Réponds UNIQUEMENT par le texte final du post LinkedIn, sans commentaires ni explications autour.`;
}

function buildProfileContext(profile, resumeText) {
    // Profil structuré, anonymisé (RGPD-friendly)
    if (profile && typeof profile === 'object') {
        const parts = [];

        if (profile.role) {
            const level = profile.experienceLevel || "niveau d'expérience non précisé";
            parts.push(`Je me situe plutôt comme ${profile.role} (${level}).`);
        }

        if (profile.sector) {
            parts.push(`Je suis principalement dans le secteur suivant : ${profile.sector}.`);
        }

        if (profile.targetAudience) {
            parts.push(`Je m'adresse surtout à : ${profile.targetAudience}.`);
        }

        if (profile.preferredStyle) {
            parts.push(`Je me reconnais davantage dans ce style de communication : ${profile.preferredStyle}.`);
        }

        if (resumeText) {
            parts.push(`Complément de contexte sur mon parcours et ma situation actuelle : ${resumeText}`);
        }

        return parts.join(' ');
    }

    // Mode rétrocompatible : ancien champ "resume" uniquement
    return resumeText || "";
}

function getUserPrompt(profileOrResume, objectif, sujet) {
    const isProfileObject = profileOrResume && typeof profileOrResume === 'object' && !Array.isArray(profileOrResume);
    const resumeText = isProfileObject ? (profileOrResume.summary || '') : profileOrResume;
    const profile = isProfileObject ? profileOrResume : null;

    const profileContext = buildProfileContext(profile, resumeText);

    let prompt = `PROFIL / CONTEXTE
${profileContext}

FOND DU POST
Objectif principal du post : ${objectif}.`;

    if (sujet) {
        prompt += `\nIdée centrale ou angle que je veux développer : ${sujet}.`;
    }

    prompt += `

Consignes :
- Utilise la partie PROFIL / CONTEXTE pour choisir la bonne voix (âge, expérience, secteur, rapport au lecteur).
- Utilise la partie FOND DU POST pour structurer le message, sans rajouter de nouveaux thèmes.
- Ne réécris pas mon brief sous forme de liste de "problèmes" ou "exigences" : transforme-le en un vrai post raconté à la première personne.

CONSIGNES STRICTES ANTI-HALLUCINATION :
- N'invente AUCUNE statistique (ex : "85% des entreprises...", "selon une étude de 2023...").
- N'invente AUCUN chiffre précis que je n'ai pas fourni.
- N'invente AUCUNE citation, étude, source ou nom d'auteur.
- N'invente AUCUN nom d'entreprise ou de personne que je n'ai pas mentionné.
- Si tu veux donner un exemple, utilise des formulations comme : "j'ai remarqué que", "dans mon expérience", "j'ai pu observer".

L'objectif est de produire un post qui sonne comme si c'était vraiment moi qui publiais, avec ma situation et mon niveau d'expérience, dans mon secteur, sans surjouer l'IA ni transformer le texte en théorie.`;

    return prompt;
}

function getFactCheckPrompt(content) {
    return `Analyse ce contenu et repère les affirmations qui pourraient nécessiter une vérification :

${content}

Pour chaque affirmation douteuse ou vérifiable, note l'affirmation elle-même, la raison pour laquelle elle pourrait être problématique, ton niveau de confiance dans sa véracité, et sa catégorie.

Réponds uniquement en JSON avec cette structure :
{
    "claims": [
        {
            "text": "l'affirmation concernée",
            "reason": "pourquoi cela mérite vérification",
            "confidence": "faible|moyen|élevé",
            "category": "statistique|fait historique|étude|autre"
        }
    ],
    "needsVerification": true/false,
    "riskLevel": "faible|moyen|élevé"
}`;
}

module.exports = {
    getSystemPrompt,
    getUserPrompt,
    buildProfileContext,
    getFactCheckPrompt,
    tones
};
