# 📜 Scripts Utilitaires

Ce dossier contient les scripts utilitaires pour le projet LinkedIn AI Writer.

## 🗂️ Liste des Scripts

### 🗄️ Base de données

- **`migrate.js`** - Script de migration de la base de données PostgreSQL
  ```bash
  node scripts/migrate.js
  ```

### 🧪 Tests

- **`test-resend-email.sh`** (Linux/Mac) - Test de la fonctionnalité de renvoi d'email
  ```bash
  chmod +x scripts/test-resend-email.sh
  ./scripts/test-resend-email.sh
  ```

- **`test-resend-email.bat`** (Windows) - Test de la fonctionnalité de renvoi d'email
  ```bash
  scripts\test-resend-email.bat
  ```

### 📤 Git

- **`commit-fix-email.sh`** (Linux/Mac) - Commit automatique des correctifs d'email
  ```bash
  chmod +x scripts/commit-fix-email.sh
  ./scripts/commit-fix-email.sh
  ```

- **`commit-fix-email.bat`** (Windows) - Commit automatique des correctifs d'email
  ```bash
  scripts\commit-fix-email.bat
  ```

## 🚀 Utilisation Rapide

### Test de la fonctionnalité email

**Windows** :
```bash
cd scripts
test-resend-email.bat
```

**Linux/Mac** :
```bash
cd scripts
chmod +x test-resend-email.sh
./test-resend-email.sh
```

### Commit des changements

**Windows** :
```bash
cd scripts
commit-fix-email.bat
```

**Linux/Mac** :
```bash
cd scripts
chmod +x commit-fix-email.sh
./commit-fix-email.sh
```

### Migration de la base de données

```bash
node scripts/migrate.js
```

## 📝 Notes

- Les scripts `.sh` nécessitent `chmod +x` avant la première utilisation
- Les scripts de test requièrent que le serveur soit en cours d'exécution (`node start-dev.js`)
- Les scripts Git vérifient automatiquement la présence de Git avant de s'exécuter

## 🔗 Liens Utiles

- [Documentation principale](../GUIDE_UTILISATION.md)
- [Guide de résolution d'email expiré](../probleme-email-expire.md)
- [Correctifs techniques](../CORRECTIF_EMAIL_EXPIRE.md)
