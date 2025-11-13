# LinkedIn AI Writer

Ton générateur de posts LinkedIn ultra-intelligent. Écrit, améliore, et prédit l'engagement de tes posts comme un vrai pro du marketing.

## L'histoire commence ici

C'est un projet fou : transformer une simple idée en un système complet qui génère des posts LinkedIn savants, les vérifie, et prédit leur succès.

Le rêve: Un outil qui parle comme un vrai professionnel, qui ne raconte pas n'importe quoi (fact-checking), et qui sait déjà quel ton va marcher le mieux avant même que tu poste.

## Ce qu'on a vraiment construit

Un backend sérieux avec Express et Node.js qui parle avec OpenAI pour générer du texte de fou, une base de données PostgreSQL qui se souvient de tout ce qu'on crée, et une API qu'on peut appeler depuis partout.

Le truc au-dessus : ça marche vraiment. Les posts se génèrent, se sauvegardent, et on peut même prédire comment ils vont kiffer.

## Les bugs qu'on a affrontés (la vrai histoire)

### Premier problème : La base de données parlait pas français

On a commencé avec une connexion directe à Supabase, et boom. Erreur mystérieuse : "getaddrinfo ENOTFOUND db.chkzyzcclkfyagkipnvg.supabase.co". Le serveur DNS ne trouvait pas le truc.

Après des heures de debug : c'était IPv6 vs IPv4. Notre réseau ne parlait qu'IPv4, mais Supabase avait fourni un endpoint IPv6. Solution : on a basculé sur le Session Pooler (port 6543 au lieu de 5432). Boom, ça a marché.

### Deuxième problème : Les caractères spéciaux qui tue tout

Le mot de passe contenait un @, et c'est un monstre dans une URL. "Didoulidaid57@" devait devenir "Didoulidaid57%40". Sinon la base de données était persuadée que le mot de passe s'arrêtait au @. Classic.

### Troisième problème : Les certificats SSL qu'on aime pas

Supabase utilise des certificats auto-signés. Node.js dit "non, c'est pas sécurisé" et refuse de se connecter. On aurait pu acheter un vrai certificat, mais le truc simple et efficace c'était : NODE_TLS_REJECT_UNAUTHORIZED=0. Oui, c'est pas très beau, mais c'est la réalité du développement rapide.

### Quatrième problème : Le serveur qui hang sans prévenir

On générait un post, et parfois le serveur disait "j'attends... j'attends..." sans rien dire. Le health check testait la DB mais s'endormait si elle répondait pas. Solution : un timeout de 2 secondes. Si la DB parle pas en 2 sec, on dit au serveur "bouge, faut qu'on continue".

## Comment on la lance maintenant

```bash
npm install
node start-dev.js
```

C'est tout. Le serveur tourne sur http://localhost:3000

## Ce qu'elle peut faire

Générer des posts: Tu donnes ton profil, ton objectif, ton ton (professionnel, inspirant, engagé), et boom, elle te génère un post qui tue.

Vérifier les faits: Elle vérifie que ce qu'elle écrit c'est pas juste du vent. Avec la Google Fact Check API.

Prédire l'engagement: Elle devine comment ton post va kiffer auprès de ton audience.

Améliorer des posts existants: Tu lui donnes un post pourri, elle le rend cool.

Tracer l'historique: Tous les posts générés sont sauvegardés. Tu peux les revoir plus tard.

## Le stack qu'on a utilisé

Backend: Node.js + Express (c'est le standard, ça marche, pas besoin de réinventer).

Intelligence Artificielle: OpenAI GPT-3.5-turbo (c'est juste meilleur que les autres pour le moment).

Base de données: PostgreSQL via Supabase (on voulait du cloud sans gérer l'infra).

Vérification des faits: Google Fact Check API (parce qu'il faut bien vérifier).

Sécurité: Helmet pour les headers, CORS configuré, Rate Limiting pour éviter les abus, Validation des données à chaque appel.

## Les tests qu'on a écrits

Avant de committer, on teste. 10 scripts de test différents qui vérifient que rien n'est cassé.

- Diagnostic complet du système
- Vérification des migrations
- Test de génération + sauvegarde en DB
- Validation de la syntaxe
- Et pleins d'autres...

## Ce qui arrive ensuite

Le frontend. React, Tailwind, une interface où tu peux taper ton profil et voir les posts se générer en direct. Un dashboard où tu vois l'engagement des posts qu'elle a générés. Authentication JWT parce qu'il faudra bien que chacun garde ses posts.

Export vers l'API LinkedIn pour poster directement depuis l'app. WebSocket pour les live updates. Peut-être du cache avec Redis si ça devient trop lourd.

## Comment on a organisé tout ça

src/ contient le backend Express, les configurations, tout ce qui est AI, et les migrations SQL.

test/ contient les 10 tests qui vérifient que tout marche.

docs/ contient la documentation interne (tu ne dois pas la voir sur GitHub, c'est caché).

Les fichiers sensibles (clés API, mot de passe) ? Ils traînent jamais dans Git. Il y a un .gitignore qui les protège. Les tests et docs internes aussi.

## À retenir

C'est pas une app parfaite. C'est une app qui marche. On a affronté les vrais problèmes (IPv6, certificats, URLs), on les a résolus avec des solutions pragmatiques, et maintenant c'est stable.

L'important c'est pas d'avoir le code le plus beau, c'est que ça marche et que ça parle avec l'IA de la bonne façon.

Maintenant on lance le frontend et on verra bien ce qui arrive.
