# Guide de Configuration Git et GitHub

## 1. Créer le repo sur GitHub

### Option A : Via l'interface GitHub (RECOMMANDÉ)
1. Va sur https://github.com/new
2. Nom du repo : `linkedin-ai-writer`
3. Description : `Générateur intelligent de posts LinkedIn avec fact-checking automatique - OpenAI + PostgreSQL`
4. Visibilité : **Private** (pour l'instant)
5. **NE PAS** initialiser avec README, .gitignore ou license (on les a déjà)
6. Clique "Create repository"
7. Copie l'URL du repo (format: `https://github.com/ton-username/linkedin-ai-writer.git`)

### Option B : Via GitHub CLI (si installé)
```bash
gh repo create linkedin-ai-writer --private --description "Générateur intelligent de posts LinkedIn avec fact-checking automatique"
```

## 2. Connecter le repo local au repo distant

Une fois le repo créé sur GitHub, exécute :

```bash
# Remplace TON-USERNAME par ton username GitHub
git remote add origin https://github.com/TON-USERNAME/linkedin-ai-writer.git

# Vérifier que c'est bien connecté
git remote -v
```

## 3. Structure des branches

Nous allons utiliser le Git Flow :
- **main** : Production stable
- **develop** : Développement actif
- **feature/** : Nouvelles fonctionnalités

## 4. Stratégie de Commits

Chaque commit sera atomique et suivra ce format :
```
type(scope): description courte

Description détaillée si nécessaire
```

Types :
- `feat`: Nouvelle fonctionnalité
- `refactor`: Refactoring du code
- `docs`: Documentation
- `config`: Configuration
- `fix`: Correction de bug
- `chore`: Tâches de maintenance

---

**ATTENDS MES INSTRUCTIONS AVANT DE CONTINUER**
Je vais te guider pour chaque commit étape par étape.
