# 🔧 Résolution du problème "Email link expired"

## 📋 Problème

Lorsque vous cliquez sur le lien de confirmation Supabase, vous obtenez :
```
http://localhost:3000/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

## ✅ Solutions

### Solution 1 : Renvoyer l'email via l'interface web

1. Ouvrez le lien qui a expiré dans votre navigateur
2. La page détectera automatiquement l'erreur
3. Cliquez sur "📧 Renvoyer l'email"
4. Entrez votre adresse email
5. Cliquez sur "Envoyer"
6. Vérifiez votre boîte de réception et cliquez rapidement sur le nouveau lien

### Solution 2 : Renvoyer l'email via l'API

```bash
curl -X POST http://localhost:3000/api/auth/resend-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email": "votre@email.com"}'
```

### Solution 3 : Renvoyer depuis le Dashboard Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Authentication > Users
4. Trouvez votre utilisateur
5. Cliquez sur "..." > "Send magic link"

### Solution 4 : Confirmer manuellement l'email (développement uniquement)

1. Allez sur Supabase Dashboard > Authentication > Users
2. Trouvez votre utilisateur
3. Cliquez sur "..." > "Confirm email"

## 🚀 Prévention

### Augmenter la durée de validité des liens (Supabase Dashboard)

1. Allez dans **Authentication > Email Templates**
2. Sélectionnez "Confirm signup"
3. Dans la configuration, modifiez le paramètre (si disponible)

### Conseils pour les utilisateurs

- ⚡ Cliquez sur le lien de confirmation **immédiatement** après réception
- 📱 Si vous êtes sur mobile, ouvrez l'email dans le navigateur par défaut
- 🔄 Si le lien expire, utilisez la fonction "Renvoyer l'email" intégrée
- ⏰ Les liens Supabase expirent généralement après **1 heure**

## 🔍 Debugging

### Vérifier si l'email a bien été envoyé

Dans le backend, vérifiez les logs :
```bash
node start-dev.js
```

### Tester l'endpoint de renvoi

```bash
curl -X POST http://localhost:3000/api/auth/resend-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' \
  -v
```

Réponse attendue :
```json
{
  "success": true,
  "message": "Email de confirmation renvoyé avec succès. Vérifiez votre boîte de réception."
}
```

## 📱 Configuration dans l'app mobile

Dans votre application React Native, ajoutez un bouton pour renvoyer l'email :

```javascript
const resendConfirmationEmail = async (email) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/resend-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      Alert.alert('Succès', 'Email de confirmation renvoyé !');
    } else {
      Alert.alert('Erreur', data.error);
    }
  } catch (error) {
    Alert.alert('Erreur', 'Impossible de renvoyer l\'email');
  }
};
```

## 🌐 Variables d'environnement requises

Vérifiez que votre `.env` contient :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :
1. Vérifiez que Supabase est bien configuré
2. Vérifiez les logs du backend
3. Vérifiez que l'email n'est pas dans les spams
4. Essayez avec une autre adresse email
