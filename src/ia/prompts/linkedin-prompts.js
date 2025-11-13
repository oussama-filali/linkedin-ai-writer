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
    
    return `Tu es un expert en rédaction de posts LinkedIn. Ton objectif est de créer des posts ${toneConfig.description}.

Règles STRICTES à respecter:
1. TOUJOURS vérifier la véracité des informations - NE JAMAIS inventer de statistiques ou faits
2. Si tu mentionnes des données, elles doivent être vérifiables ou clairement présentées comme estimation personnelle
3. Longueur optimale: 150-300 mots
4. Format LinkedIn: paragraphes courts, espaces pour la lisibilité
5. PAS de hashtags excessifs (max 3-5 pertinents à la fin)
6. PAS de call-to-action agressif type "clique ici"
7. Ton ${ton}:
${toneConfig.guidelines.map(g => `   - ${g}`).join('\n')}

Si tu n'as pas assez d'informations pour créer un post de qualité avec des faits vérifiables, DEMANDE plus de contexte à l'utilisateur.`;
}

function getUserPrompt(resume, objectif, sujet) {
    let prompt = `Contexte professionnel de l'utilisateur:
${resume}

Objectif du post: ${objectif}`;

    if (sujet) {
        prompt += `\n\nSujet spécifique: ${sujet}`;
    }

    prompt += `\n\nCrée un post LinkedIn engageant qui:
1. Capte l'attention dès les 2 premières lignes
2. Apporte de la valeur au réseau
3. Reflète l'authenticité et l'expertise de l'utilisateur
4. Encourage l'engagement (likes, commentaires, partages)
5. Se base UNIQUEMENT sur des informations vérifiables ou l'expérience personnelle décrite

NE JAMAIS inventer de statistiques ou faits. Si besoin de données, utilise des formulations comme "d'après mon expérience" ou "j'ai observé que".`;

    return prompt;
}

function getFactCheckPrompt(content) {
    return `Analyse le contenu suivant et identifie toutes les affirmations factuelles qui nécessitent une vérification:

${content}

Pour chaque affirmation factuelle identifiée, indique:
1. L'affirmation exacte
2. Pourquoi elle nécessite vérification
3. Le niveau de confiance (faible/moyen/élevé) si elle peut être facilement vérifiée

Format de réponse JSON:
{
    "claims": [
        {
            "text": "affirmation à vérifier",
            "reason": "pourquoi vérifier",
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
