import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Share,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { fetchPostById } from '@/services/post-service';
import { usePostDraftStore, type PostDraftState } from '@/stores/post-draft-store';

export default function PreviewScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const postId = typeof params.id === 'string' ? params.id : undefined;
  const { token } = useAuth();
  const draft = usePostDraftStore((state: PostDraftState) => state.draft);
  const clearDraft = usePostDraftStore((state: PostDraftState) => state.clearDraft);

  const detailQuery = useQuery({
    queryKey: ['post-detail', postId, token],
    queryFn: () => fetchPostById(postId!, token),
    enabled: Boolean(postId),
  });

  const post = postId ? detailQuery.data : draft;
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  if (postId && detailQuery.isLoading) {
    return <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 32 }} />;
  }

  if (!post) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Aucun brouillon à afficher</Text>
        <Text style={styles.emptySubtitle}>Génère un post ou ouvre un élément depuis l’historique.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/generate')}>
          <Text style={styles.primaryButtonText}>Aller à Générer</Text>
        </Pressable>
      </View>
    );
  }

  const hashtags = post.hashtags?.length ? `#${post.hashtags.join(' #')}` : 'Aucun hashtag proposé';

  const composeText = () => {
    const blocks = [post.body?.trim()].filter(Boolean) as string[];
    const ht = post.hashtags?.length ? `\n\n#${post.hashtags.join(' #')}` : '';
    return `${blocks.join('\n\n')}${ht}`.trim();
  };

  const nextAt = (hours: number, minutes: number) => {
    const now = new Date();
    const when = new Date();
    when.setHours(hours, minutes, 0, 0);
    if (when.getTime() <= now.getTime()) when.setDate(when.getDate() + 1);
    return when;
  };

  const handleSchedule = () => {
    const options = [
      { label: "12:30 aujourd'hui ou demain", date: nextAt(12, 30) },
      { label: "17:30 aujourd'hui ou demain", date: nextAt(17, 30) },
      { label: '08:30 demain (si passé)', date: nextAt(8, 30) },
    ];

    Alert.alert(
      'Programmer un rappel',
      'Choisis un horaire recommandé pour recevoir une notification et publier.',
      [
        { text: `📤 Partager maintenant`, onPress: () => handleShare() },
        ...options.map((o) => ({ text: `⏰ ${o.label}`, onPress: () => scheduleAt(o.date) })),
        { text: 'Fermer', style: 'cancel' },
      ]
    );
  };

  const handleCopy = async () => {
    const text = composeText();
    try {
      if (
        Platform.OS === 'web' &&
        typeof navigator !== 'undefined' &&
        (navigator as any).clipboard?.writeText
      ) {
        await (navigator as any).clipboard.writeText(text);
        setCopied(true);
        return;
      }
      // Essaye d'utiliser expo-clipboard si disponible (sans import statique)
      try {
        // @ts-ignore - module optionnel installé via Expo
        const Clipboard: any = await import('expo-clipboard');
        if (Clipboard?.setStringAsync) {
          await Clipboard.setStringAsync(text);
          setCopied(true);
          return;
        }
      } catch {}
      // Fallback: partage système (permet de coller ensuite dans LinkedIn)
      await Share.share({ message: text });
    } catch (e) {
      Alert.alert('Impossible de copier', 'Tu peux sélectionner et copier depuis la vue.');
    }
  };

  const handleShare = async () => {
    const text = composeText();
    try {
      await Share.share({ message: text });
    } catch {
      // ignore
    }
  };

  const scheduleAt = async (fireDate: Date) => {
    try {
      // @ts-ignore - module optionnel installé via Expo
      const Notifications: any = await import('expo-notifications');
      if (!Notifications?.scheduleNotificationAsync) {
        Alert.alert('Programmation indisponible', 'Module de notifications manquant.');
        return;
      }
      // Demander les permissions si nécessaire
      const perms = await Notifications.getPermissionsAsync();
      if (!perms.granted) {
        const ask = await Notifications.requestPermissionsAsync();
        if (!ask.granted) {
          Alert.alert('Permission requise', 'Active les notifications pour programmer un rappel.');
          return;
        }
      }
      // Optionnel: handler par défaut pour afficher l'alerte
      if (Notifications.setNotificationHandler) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
        });
      }
      const text = composeText();
      // S'assurer que l'horaire est bien le prochain créneau local
      const now = new Date();
      const local = new Date(fireDate);
      if (local.getTime() <= now.getTime()) {
        local.setDate(local.getDate() + 1);
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Publier sur LinkedIn',
          body: 'Rappel: ton post est prêt. Clique pour copier et publier.',
          data: { text },
        },
        trigger: local,
      });
      Alert.alert('Programmé', `Rappel prévu le ${local.toLocaleString()}`);
    } catch (e) {
      Alert.alert('Programmation échouée', 'Impossible de planifier un rappel.');
    }
  };

  const handleReset = () => {
    if (!postId) {
      clearDraft();
    }
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.subtitle}>{post.summary}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Contenu</Text>
        <Text style={styles.body}>{post.body}</Text>
      </View>

      {post.insights?.length ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Angles proposés</Text>
          {post.insights.map((insight: string) => (
            <Text key={insight} style={styles.bullet}>
              • {insight}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Hashtags</Text>
        <Text style={styles.hashtags}>{hashtags}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.primaryButton, styles.actionButton]} onPress={handleSchedule}>
          <Text style={styles.primaryButtonText}>Programmer</Text>
        </Pressable>
        <Pressable style={[styles.secondaryButton, styles.actionButton]} onPress={handleCopy}>
          <Text style={styles.secondaryButtonText}>Copier</Text>
        </Pressable>
        <Pressable style={[styles.secondaryButton, styles.actionButton]} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Fermer</Text>
        </Pressable>
        {copied ? (
          <View style={{
            backgroundColor: '#22c55e',
            padding: 10,
            borderRadius: 6,
            marginTop: 8,
          }}>
            <Text style={{ color: 'white', textAlign: 'center' }}>Copié dans le presse‑papiers</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0b1831',
  },
  subtitle: {
    color: '#475467',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  body: {
    color: '#0f172a',
    lineHeight: 22,
  },
  bullet: {
    color: '#0f172a',
    marginTop: 4,
  },
  hashtags: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(10,126,164,0.4)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.light.tint,
    fontWeight: '700',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySubtitle: {
    color: '#475467',
    textAlign: 'center',
  },
});
