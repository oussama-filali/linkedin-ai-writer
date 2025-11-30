# 🚨 ACTION IMMÉDIATE - Configuration Supabase

## ⚡ À faire MAINTENANT sur Supabase Dashboard

### 1. Ouvre ton projet Supabase
👉 [https://supabase.com/dashboard](https://supabase.com/dashboard)

Projet : **chkzyzcclkfyagkipnvg** (celui dans ton app.json)

---

### 2. Configuration Authentication

#### Navigation
```
Dashboard → Authentication → Configuration
```

#### Paramètres à modifier

##### ✅ Site URL
```
linkedinaiwritermobile://
```

##### ✅ Redirect URLs (ajoute cette ligne)
```
linkedinaiwritermobile://**
```
**Note** : Les autres URLs (localhost, etc.) peuvent rester

##### ✅ Email Confirmations
**DÉSACTIVE** pour le développement :
- [ ] Enable email confirmation

**Pourquoi ?** 
- En dev, tu veux tester rapidement sans vérifier les emails
- En production, tu pourras réactiver

---

### 3. Test de configuration

#### Vérifie que tu as ces paramètres :

```
✅ Email Provider : Enabled
✅ Site URL : linkedinaiwritermobile://
✅ Redirect URLs : linkedinaiwritermobile://**
✅ Email Confirmation : Disabled (pour le dev)
```

---

### 4. (Optionnel) Création table profiles

Si tu veux stocker des infos utilisateur supplémentaires :

#### SQL Editor → New Query

```sql
-- Table profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  headline TEXT,
  email TEXT,
  provider TEXT DEFAULT 'supabase',
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Active RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy : Chaque utilisateur voit son propre profil
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Fonction pour créer automatiquement le profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger qui crée le profil après inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Pourquoi ?**
- Stockage d'infos supplémentaires (nom, headline, etc.)
- Auto-création du profil à l'inscription
- RLS activé pour la sécurité

---

### 5. Vérifie les clés dans app.json

#### Ton fichier `app.json` actuel :
```json
"supabase": {
  "url": "https://chkzyzcclkfyagkipnvg.supabase.co",
  "anonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Vérifie dans Supabase Dashboard
```
Settings → API
```

**Copie** :
- ✅ Project URL → doit correspondre à ton `url`
- ✅ anon/public key → doit correspondre à ton `anonKey`

**⚠️ NE PARTAGE JAMAIS LA SERVICE ROLE KEY** (pas dans le code frontend)

---

### 6. Test final

#### Dans ton terminal :
```bash
cd "C:\wamp64\www\projet Perso\linkedin-ai-writer\src\frontend\linkedin-ai-writer-mobile"
npm start
```

#### Dans l'app :
1. Clique sur "Créer un compte"
2. Email : `test@example.com`
3. Password : `test123456` (min 6 caractères)
4. Clique "Créer mon compte"

**Résultat attendu** :
- ✅ Redirection immédiate vers `/(tabs)/home`
- ✅ Pas de message "Vérifie ta boîte mail"

**Si ça marche pas** :
1. Vérifie les logs dans le terminal
2. Vérifie que email confirmation est bien **désactivée**
3. Vérifie les URLs dans Supabase

---

## 📱 Activer Email Confirmation (Production)

**Quand tu veux activer la confirmation par email** :

### 1. Dans Supabase Dashboard
```
Authentication → Configuration → Enable email confirmation
```

### 2. Configure Email Templates (optionnel)
```
Authentication → Email Templates → Confirm signup
```

Tu peux personnaliser :
- Le sujet de l'email
- Le contenu HTML
- Le lien de confirmation

### 3. Dans ton code (déjà fait)
```typescript
// Dans login.tsx, le code affiche déjà :
if (result?.needsConfirmation) {
  Alert.alert('Vérifie ta boîte mail', 
    "Confirme ton inscription via le lien Supabase avant de te connecter.");
  return;
}
```

---

## 🎯 Récap rapide

### Fait ✅
- [x] Code simplifié dans `hooks/use-auth.ts`
- [x] Documentation créée
- [x] Support email confirmation

### À faire 🔧
- [ ] Configure Supabase Dashboard (URLs + Email confirmation OFF)
- [ ] (Optionnel) Crée la table `profiles`
- [ ] Teste l'inscription dans l'app

---

## 🆘 Aide

Si tu as des erreurs, regarde :
1. **Console de l'app** : Logs détaillés
2. **Supabase Dashboard → Logs** : Erreurs auth
3. **README-CORRECTION.md** : Guide de debugging

Bonne chance ! 🚀
