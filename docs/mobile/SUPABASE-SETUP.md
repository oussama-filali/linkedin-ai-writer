# Configuration Supabase - Checklist

## 1. Configuration de l'authentification

### Dashboard Supabase → Authentication → Settings

#### Email Settings
- [ ] **Enable Email Confirmations** : 
  - ✅ **OFF** pour développement (connexion immédiate après inscription)
  - ✅ **ON** pour production (email de confirmation requis)

#### URL Configuration
```
Site URL: linkedinaiwritermobile://
```

```
Redirect URLs (un par ligne):
linkedinaiwritermobile://**
http://localhost:8081
http://localhost:19006
```

#### Providers
- [x] Email (activé par défaut)
- [ ] Google OAuth (optionnel)
- [ ] Autres providers (optionnel)

## 2. Configuration de l'app mobile

### `app.json`
```json
{
  "expo": {
    "scheme": "linkedinaiwritermobile",
    "extra": {
      "supabase": {
        "url": "https://[TON-PROJET].supabase.co",
        "anonKey": "[TA-CLE-ANON]"
      }
    }
  }
}
```

### Variables d'environnement (optionnel)
Si tu veux utiliser des variables d'environnement au lieu de `app.json`:

Créer `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://[TON-PROJET].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[TA-CLE-ANON]
```

## 3. Configuration des tables (Database)

### Table `profiles` (recommandée)
```sql
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

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Policy: Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policy: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
```

### Fonction trigger pour créer automatiquement le profil
```sql
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

-- Trigger qui s'exécute après chaque nouvelle inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 4. Test de la configuration

### Test 1 : Connexion à Supabase
```bash
cd "C:\\wamp64\\www\\projet Perso\\linkedin-ai-writer\\src\\frontend\\linkedin-ai-writer-mobile"
npm start
```

L'app doit démarrer sans erreur de configuration Supabase.

### Test 2 : Inscription
1. Lance l'app
2. Va sur l'écran de connexion
3. Clique sur "Créer un compte"
4. Entre un email et un mot de passe (min 6 caractères)
5. Si email confirmation désactivée → connexion immédiate
6. Si email confirmation activée → message "Vérifie ta boîte mail"

### Test 3 : Connexion
1. Entre l'email et le mot de passe
2. Clique sur "Se connecter"
3. Tu dois être redirigé vers `/(tabs)/home`

### Test 4 : Persistence
1. Connecte-toi
2. Ferme l'app complètement
3. Rouvre l'app
4. Tu dois rester connecté (session restaurée automatiquement)

### Test 5 : Déconnexion
1. Connecté, va sur l'écran de profil/settings
2. Déconnecte-toi
3. Tu dois revenir à l'écran de connexion
4. Les tokens doivent être effacés du SecureStore

## 5. Debugging

### Voir les logs Supabase
```javascript
// Dans hooks/use-auth.ts, ajoute temporairement :
console.log('Supabase session:', data.session);
console.log('Supabase user:', data.user);
```

### Tester la connexion Supabase manuellement
```javascript
import { supabase } from '@/services/supabase-client';

// Dans une fonction async:
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
});
console.log('Result:', data, error);
```

### Vérifier les tokens dans le SecureStore
```javascript
import * as SecureStore from 'expo-secure-store';

const token = await SecureStore.getItemAsync('linkedin-ai-sb-access-token');
console.log('Stored token:', token);
```

## 6. Problèmes fréquents

### "Invalid login credentials"
- ✅ Vérifie que l'email existe dans Supabase Dashboard → Authentication → Users
- ✅ Vérifie que le mot de passe est correct
- ✅ Si email confirmation activée, vérifie que l'email a été confirmé

### "Email not confirmed"
- ✅ Va dans Supabase Dashboard → Authentication → Users
- ✅ Trouve l'utilisateur et clique sur "Confirm email"
- OU désactive "Enable Email Confirmations" dans Settings

### "Session invalid"
- ✅ Les tokens ont expiré → reconnecte-toi
- ✅ Efface le SecureStore et réessaie
- ✅ Vérifie que les clés Supabase sont correctes dans `app.json`

### "Supabase URL ou clé anon manquante"
- ✅ Vérifie `app.json` → `extra.supabase.url` et `extra.supabase.anonKey`
- ✅ Ou définis `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 7. Ressources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Expo Linking](https://docs.expo.dev/versions/latest/sdk/linking/)
