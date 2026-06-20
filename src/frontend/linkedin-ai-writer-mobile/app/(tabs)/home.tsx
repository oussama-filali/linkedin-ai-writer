import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import ThreeIntro from '@/components/ThreeIntro';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

/** Renvoie les initiales d'un nom pour l'avatar de secours. */
function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

const highlights = [
  'Tu choisis le type : storytelling, conseil, réponse, performance',
  'Une voix humaine et personnalisée selon tes posts passés',
  'Fact-check automatique avec de vraies sources',
];

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, checkingSession, authenticating, user } = useAuth();

  const ctaLabel = isAuthenticated ? 'Créer un post' : 'Se connecter';

  const handlePrimaryAction = () => {
    if (isAuthenticated) {
      router.push({ pathname: '/(tabs)/generate' });
    } else {
      router.push('/login' as never);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.canvasWrapper}>
          <ThreeIntro />
        </View>
        <Text style={styles.title}>LinkedIn AI Writer</Text>
        <Text style={styles.subtitle}>
          Choisis un type de post, dis ce que tu veux raconter, et obtiens un post qui sonne
          vraiment comme toi — vérifié et sourcé.
        </Text>
        {checkingSession || authenticating ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Vérification de la session...</Text>
          </View>
        ) : isAuthenticated ? (
          // Carte profil : photo (ou initiales) à côté du nom/prénom
          <View style={styles.profileRow}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
              </View>
            )}
            <View>
              <Text style={styles.profileName}>{user?.name ?? 'Profil'}</Text>
              <Text style={styles.profileStatus}>Connecté</Text>
            </View>
          </View>
        ) : (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Tu n’es pas connecté</Text>
          </View>
        )}
        <View style={styles.highlightWrapper}>
          {highlights.map((item) => (
            <View key={item} style={styles.highlightItem}>
              <View style={styles.dot} />
              <Text style={styles.highlightText}>{item}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handlePrimaryAction}
          style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}
          disabled={checkingSession || authenticating}>
          {checkingSession || authenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{ctaLabel}</Text>
          )}
        </Pressable>

        {isAuthenticated && (
          <Pressable
            onPress={() => router.push({ pathname: '/(tabs)/history' })}
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}>
            <Text style={styles.secondaryButtonText}>Voir mon historique</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollContent: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 48,
    gap: 18,
  },
  canvasWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0b1831',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#364152',
    textAlign: 'center',
    lineHeight: 22,
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 119, 181, 0.1)',
  },
  badgeText: {
    color: '#0077b5',
    fontWeight: '600',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,126,164,0.15)',
  },
  avatarInitials: {
    color: '#0a7ea4',
    fontWeight: '700',
    fontSize: 16,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0b1831',
  },
  profileStatus: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  highlightWrapper: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#fff',
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.tint,
  },
  highlightText: {
    flex: 1,
    color: '#1c2a3a',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 181, 0.4)',
  },
  secondaryButtonText: {
    color: '#0b6fa4',
    fontWeight: '600',
  },
});
