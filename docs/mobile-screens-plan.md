# Plan fonctionnel écrans mobile

## Écran "Générer" (Brief & génération)

1. **Section Profil & objectif**
   - Champs multi-lignes :
     - `resume` (résumé expertise, obligatoire, min 20 caractères côté backend).
     - `objective` (but du post, obligatoire, min 20 caractères).
   - Groupe de chips `tones[]` (professionnel, inspirant, engagé). Valeur envoyée sous forme de string.
   - Validation côté app : bloquer la génération si `resume` ou `objective` vide, message d’erreur.

2. **Section Secteur & focus**
   - Chips `sectors[]` + `domains[]` (unique sélection).
   - Champ texte `audience` (par défaut « Opérations marketing Europe », facultatif mais recommandé pour ajuster la tonalité IA).

3. **Section Programmation intelligente**
   - Switch `autoPublish` : autorise publication sans confirmation → doit être reflété dans payload API pour que le backend déclenche directement `/posts/publish`.
   - Switch `notifyBefore` : si vrai, backend ajoute un rappel push 15 min avant le créneau.
   - `recommendedSlots[]` (liste fournie par backend plus tard). Possibilité de sélectionner "autre" ⇒ ouvrir date picker natif et stocker `customSlot`.

4. **CTA "Générer le post"**
   - Payload attendu :
     ```json
     {
       "resume": "string",
       "objective": "string",
       "tone": "professionnel|inspirant|engagé",
       "sector": "Tech & SaaS" (etc.),
       "domain": "Lancement produit" (etc.),
       "audience": "string",
       "autoPublish": true/false,
       "notifyBefore": true/false,
       "slot": "ISO8601" (créneau recommandé ou custom)
     }
     ```
   - Réponse backend : brouillon IA + métadonnées (score, hashtags). Stocker dans Zustand/Context puis rediriger vers un écran Preview (à créer).

5. **État de chargement**
   - Bouton affiche « Génération en cours… », désactivé.
   - Prévoir fallback en cas d’échec (toast + conserver les inputs).

## Écran "Historique"

1. **Sources de données**
   - Endpoint `GET /posts?limit=50` renvoie : `id`, `title`, `summary`, `scheduledFor`, `status`, `performance`, `autoPublish`, `factCheckStatus`.
   - Status possibles : `draft`, `scheduled`, `published`, `blocked`.

2. **Affichage carte**
   - Titre du post / audience courte.
   - Badge status (couleur selon état).
   - Sous-titre : `formatDate(scheduledFor)` + `autoPublish ? "Auto" : "Manuel"`.
   - Performance : impressions / CTR (si status `published`).

3. **Actions**
   - Bouton "Voir" → ouvre détail (modal ou nouvel écran) avec preview + actions.
   - Bouton "Replanifier" actif uniquement pour `scheduled`/`blocked`.
   - Swipe vers la gauche pour supprimer un brouillon (optionnel).

4. **Empty state**
   - Message « Aucun post généré pour l’instant », CTA vers écran Générer.

## Écran "Paramètres"

1. **Bloc Compte**
   - Si authentifié : afficher `user.name`, `user.email`, provider (Google aujourd’hui, LinkedIn demain).
   - Bouton "Se déconnecter" → `useAuth.logout()` + appel `/auth/logout`.

2. **Bloc Notifications**
   - `pushEnabled` : sauvegarder via `PATCH /users/preferences`.
   - `factCheckEnabled` : active envoi d’une alerte si l’IA détecte un risque.

3. **Bloc Automatisation**
   - `autoPostEnabled` global : valeur par défaut appliquée quand on coche "Publier automatiquement" dans Générer.
   - Lien "Configurer les heures idéales" : ouvrira modal/écran pour choisir créneaux par jour (à créer).

4. **Persistance**
   - Toutes les préférences doivent être chargées au mount (`GET /users/preferences`) et mises à jour optimistiquement.

## Étapes suivantes

1. Brancher `GenerateScreen` sur un store (Zustand/React Query) pour récupérer `recommendedSlots` et envoyer le brief.
2. Créer service `post-service.ts` (frontend) pour encapsuler les appels (generate, fetch history, reschedule).
3. Implémenter backend endpoints correspondants (`POST /posts/generate`, `GET /posts`, `PATCH /posts/:id/schedule`, `PATCH /users/preferences`).
