# Scripts de Test - LinkedIn AI Writer

## Tests Disponibles dans `/test`

### 1. Test de Diagnostic Complet
```bash
node test/diagnostic.js
```
Vérifie:
- Fichiers critiques
- Variables d'environnement
- Dépendances npm
- Syntaxe modules

### 2. Vérification des Migrations
```bash
node test/check-migrations.js
```
Affiche:
- Migrations exécutées
- Migrations en attente
- Tables existantes

### 3. Test de Connexion DB
```bash
node test-db.js
```
Vérifie:
- Connexion PostgreSQL
- Tables existantes
- Migrations OK

### 4. Quick Check Rapide
```bash
node test/quick-check.js
```

## Démarrage du Serveur

```bash
node start-dev.js
```

## Endpoints API

```bash
# Health
curl http://localhost:3000/health

# Générer
curl -X POST http://localhost:3000/api/posts/generate \
  -H "Content-Type: application/json" \
  -d '{"resume":"...","objectif":"...","ton":"professionnel"}'
  

# Analyser prédictions
curl -X POST http://localhost:3000/api/predictions/analyze \
  -H "Content-Type: application/json" \
  -d '{"content":"....."}'
```

## Résolution de Problèmes

### Le serveur ne démarre pas
1. Vérifie: `node test/diagnostic.js`
2. Réinstalle: `npm install`
3. Vérifie: `.env`

### Erreur DB
1. Vérifie: `node test/check-migrations.js`
2. Lance: `npm run db:migrate`
3. Teste: `node test-db.js`

### Erreur OpenAI
- Vérifie la clé API dans `.env`
- Vérifie les crédits disponibles

## Notes Importantes

- TLS bypass activé pour Supabase pooler
- Rate limiting: 100 req/15min par IP
- Erreurs non cachées: loggées et reportées

Tous les tests sont dans le dossier `/test/`.
