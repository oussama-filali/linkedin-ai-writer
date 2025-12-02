# LinkedIn AI Writer – Mobile

Application Expo/React Native pensée **mobile-first** pour piloter LinkedIn AI Writer : génération de posts, planification, notifications et animations 3D inspirées du dashboard web.

## 1. Démarrage rapide

```bash
cd src/frontend/linkedin-ai-writer-mobile
npm install
npm start
```

Depuis le menu Expo :

- `a` → Android Emulator
- `i` → iOS Simulator
- Scanner le QR code dans Expo Go

Assure-toi que le backend est lancé (`node start-dev.js`) afin que les appels API /health répondent.

## 2. Structure principale

```
app/                # Routage Expo Router + écrans (Home, Auth, Planning...)
components/         # UI réutilisable (buttons, cards)
hooks/              # Hooks (auth, notifications)
constants/          # Thèmes, couleurs, tokens
scripts/            # Utilitaires (reset, lint)
assets/             # Fonts, illustrations, Lottie
TESTING.md          # Plan de tests simple & avancé (entrée → sortie)
```

## 3. Fonctionnalités prévues & statut

| Feature | Statut | Notes |
|---------|--------|-------|
| Home / Onboarding | ✅ Prototype | Texte d’accueil prêt, responsive |
| Auth LinkedIn (OAuth) | 🛠️ À faire | Utilisera `expo-auth-session` + backend callback |
| Génération de posts | 🛠️ À faire | Formulaire → POST `/api/posts/generate` |
| Scheduling & notifications | 🛠️ À faire | UI calendrier + Expo Push + backend Agenda |
| Animation 3D background | 🛠️ À faire | `expo-three` / `@react-three/fiber` |

## 4. Tests (entrée → sortie)

Chaque feature doit être testée avec un **scénario simple** (happy path) et un **scénario avancé** (erreurs, offline, multi-device). Consulte `TESTING.md` pour la table complète.

Exemple rapide :

```text
Feature : Génération
1. Saisir résumé + objectif + ton
2. Taper « Générer » → POST /api/posts/generate
3. Afficher la preview + sauvegarder en local
4. Cas avancé : timeout backend → message + retry
```

## 5. Animations & motion

- `@react-three/fiber` + `expo-gl` pour la scène 3D
- `react-native-reanimated` + `react-native-gesture-handler` pour les transitions
- Pensé pour réduire l’intensité si « Low Power Mode » est activé

## 6. Notifications & scheduling

1. Permissions via `expo-notifications`
2. Backend planifie via Agenda/BullMQ
3. L’app affiche une notification « prêt à publier ? » avant l’heure idéale

## 7. Qualité & scripts

```bash
npm run lint         # ESLint + Expo lint rules
# (Prochainement) npm test      # Jest + RTL
# (Prochainement) npm run test:e2e  # Detox
```

Avant chaque merge : lancer les scénarios décrits dans `TESTING.md` et capturer les résultats (Notion / docs).

---

Besoin d’un environnement propre ?

```bash
npm run reset-project
```

Ensuite réimporte les composants utiles depuis `app-example/` si nécessaire.
