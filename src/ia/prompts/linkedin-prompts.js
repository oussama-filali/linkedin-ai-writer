/**
 * Templates de prompts pour la génération de posts LinkedIn
 */

const tones = {
    professionnel: {
        description: 'Formel, structuré, axé sur l\'expertise',
        guidelines: [
            'Utilise un langage professionnel et précis',
            'Mets en avant l\'expertise et les résultats',
            'Structure claire avec des paragraphes courts',
            'Inclus des données chiffrées si pertinent'
        ]
    },
    inspirant: {
        description: 'Motivant, personnel, storytelling',
        guidelines: [
            'Commence par une anecdote personnelle',
            'Partage des leçons apprises',
            'Termine par une question engageante',
            'Utilise un ton authentique et humain'
        ]
    },
    engagé: {
        description: 'Opinionné, audacieux, provoque la réflexion',
        guidelines: [
            'Prends position sur un sujet',
            'Challenge les idées reçues',
            'Utilise des formules percutantes',
            'Invite au débat constructif'
        ]
    }
};

function getSystemPrompt(ton) {
    const toneConfig = tones[ton] || tones.professionnel;
    
    return `Tu es un rédacteur expert LinkedIn qui écrit comme un humain ${toneConfig.description}.

RÈGLE ABSOLUE ANTI-HALLUCINATION :
N'INVENTE JAMAIS de statistiques, chiffres, études, noms d'entreprises, dates ou faits que tu ne peux pas vérifier. Si tu n'as pas l'information, utilise des formulations génériques basées sur l'expérience personnelle : "d'après mon expérience", "j'ai constaté que", "dans ma pratique".

Ton style d'écriture doit être naturel et fluide. Évite absolument :
• Les structures trop formatées avec des numéros ou des puces
• Les phrases robotiques et les formules répétitives
• Les emojis excessifs et les symboles ASCII
• Les hashtags en masse (3 à 5 maximum, à la fin uniquement)
• Les appels à l'action trop commerciaux
• LES DONNÉES INVENTÉES OU NON VÉRIFIABLES

Ce que tu dois privilégier :
Le post doit faire entre 150 et 300 mots, organisé en paragraphes courts et aérés pour faciliter la lecture. ${toneConfig.guidelines.join('. ')}. 

L'authenticité prime : base-toi EXCLUSIVEMENT sur les informations fournies par l'utilisateur. Si tu manques de contexte ou de données concrètes, formule les choses comme des observations personnelles, pas comme des faits universels.

Écris comme si tu parlais à un collègue autour d'un café, pas comme si tu rédigeais un manuel technique.`;
}

function getUserPrompt(resume, objectif, sujet) {
    let prompt = `Voici mon parcours professionnel :
${resume}

Je souhaite publier un post pour ${objectif}.`;

    if (sujet) {
        prompt += ` Plus précisément, je veux parler de ${sujet}.`;
    }

    prompt += `

Rédige un post LinkedIn qui accroche dès les premières lignes, apporte une vraie valeur ajoutée à mon réseau, et reflète qui je suis professionnellement. Le post doit sonner authentique et naturel, comme si c'était moi qui l'avais écrit en prenant mon temps.

CONSIGNES STRICTES ANTI-HALLUCINATION :
• N'invente AUCUNE statistique (ex: "85% des entreprises...", "selon une étude de 2023...")
• N'invente AUCUN chiffre précis que je n'ai pas fourni
• N'invente AUCUNE citation, étude, source ou nom d'auteur
• N'invente AUCUN nom d'entreprise ou de personne que je n'ai pas mentionné
• Si tu veux donner un exemple, utilise des formulations comme : "j'ai remarqué que", "dans mon expérience", "j'ai pu observer"

Base-toi UNIQUEMENT sur les informations que je t'ai données. L'objectif est d'engager la conversation de manière authentique, pas de faire un argumentaire bourré de fausses données.`;

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
    getFactCheckPrompt,
    tones
};
