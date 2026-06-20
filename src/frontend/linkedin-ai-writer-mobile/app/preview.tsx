import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { fetchPostById } from '@/services/post-service';
import { ScheduleReminder } from '@/components/ScheduleReminder';
import { EditPost } from '@/components/EditPost';
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

  const basePost = postId ? detailQuery.data : draft;
  // Texte modifié localement (après une demande de modification IA).
  // Surcharge le corps du post sans muter la source.
  const [editedBody, setEditedBody] = useState<string | null>(null);
  const post = basePost
    ? { ...basePost, body: editedBody ?? basePost.body }
    : basePost;
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
        <Text style={styles.emptyTitle}>Aucun post à afficher</Text>
        <Text style={styles.emptySubtitle}>Génère un post ou ouvre un élément depuis l’historique.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/generate')}>
          <Text style={styles.primaryButtonText}>Créer un post</Text>
        </Pressable>
      </View>
    );
  }

  const sources = post.sources ?? [];
  const hashtags = post.hashtags?.length ? `#${post.hashtags.join(' #')}` : null;

  const composeText = () => {
    const blocks = [post.body?.trim()].filter(Boolean) as string[];
    const ht = post.hashtags?.length ? `\n\n#${post.hashtags.join(' #')}` : '';
    return `${blocks.join('\n\n')}${ht}`.trim();
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
      try {
        // @ts-ignore - module optionnel installé via Expo
        const Clipboard: any = await import('expo-clipboard');
        if (Clipboard?.setStringAsync) {
          await Clipboard.setStringAsync(text);
          setCopied(true);
          return;
        }
      } catch {}
      await Share.share({ message: text });
    } catch {
      Alert.alert('Impossible de copier', 'Tu peux sélectionner et copier depuis la vue.');
    }
  };

  const handleShare = async () => {
    const text = composeText();

    // Sur le web : Share.share() de React Native ne fonctionne pas.
    // On utilise la Web Share API du navigateur, avec repli sur la copie.
    if (Platform.OS === 'web') {
      try {
        if (typeof navigator !== 'undefined' && (navigator as any).share) {
          await (navigator as any).share({ text });
          return;
        }
        // Repli : copie dans le presse-papiers si le partage n'est pas dispo.
        if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
          await (navigator as any).clipboard.writeText(text);
          setCopied(true);
          return;
        }
        Alert.alert('Partage indisponible', 'Copie le texte manuellement depuis la vue.');
      } catch {
        // L'utilisateur a annulé le partage, ou erreur : on ignore silencieusement.
      }
      return;
    }

    // Sur mobile (iOS/Android) : partage natif.
    try {
      await Share.share({ message: text });
    } catch {
      // ignore (annulation utilisateur)
    }
  };

  const handleClose = () => {
    if (!postId) clearDraft();
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{post.title}</Text>
        {post.isAiGenerated !== false && (
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>✨ Généré par IA</Text>
          </View>
        )}
      </View>
      {post.type ? <Text style={styles.typeLabel}>Type · {post.type}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Le post</Text>
        <Text style={styles.body}>{post.body}</Text>
      </View>

      {/* Sources réelles (URLs vérifiables) attachées aux infos factuelles */}
      {sources.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Sources vérifiées</Text>
          {sources.map((s, i) => (
            <Pressable key={`${s.url}-${i}`} onPress={() => Linking.openURL(s.url)}>
              <Text style={styles.sourceName}>{s.source}</Text>
              <Text style={styles.sourceUrl} numberOfLines={1}>
                {s.url}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.cardMuted}>
          <Text style={styles.mutedText}>
            Aucune source externe : ce post s’appuie sur ton vécu, sans affirmation factuelle à vérifier.
          </Text>
        </View>
      )}

      {hashtags ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Hashtags</Text>
          <Text style={styles.hashtags}>{hashtags}</Text>
        </View>
      ) : null}

      {/* Modification du post via l'IA (selon un retour de l'utilisateur) */}
      {post.id ? (
        <EditPost postId={post.id} onUpdated={(newText) => setEditedBody(newText)} />
      ) : null}

      {/* Programmation d'un rappel au meilleur créneau (heure locale) */}
      <ScheduleReminder type={post.type} text={composeText()} />

      <View style={styles.actions}>
        <Pressable style={[styles.primaryButton, styles.actionButton]} onPress={handleCopy}>
          <Text style={styles.primaryButtonText}>Copier</Text>
        </Pressable>
        <Pressable style={[styles.secondaryButton, styles.actionButton]} onPress={handleShare}>
          <Text style={styles.secondaryButtonText}>Partager</Text>
        </Pressable>
        <Pressable style={[styles.secondaryButton, styles.actionButton]} onPress={handleClose}>
          <Text style={styles.secondaryButtonText}>Fermer</Text>
        </Pressable>
      </View>
      {copied ? (
        <View style={styles.copiedBanner}>
          <Text style={styles.copiedText}>Copié dans le presse‑papiers</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#0b1831', flex: 1 },
  aiBadge: {
    backgroundColor: 'rgba(10,126,164,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  aiBadgeText: { color: Colors.light.tint, fontWeight: '600', fontSize: 12 },
  typeLabel: { color: '#475467', textTransform: 'capitalize' },
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
  cardMuted: {
    backgroundColor: 'rgba(15,23,42,0.03)',
    borderRadius: 16,
    padding: 14,
  },
  mutedText: { color: '#6b7280', fontSize: 13 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  body: { color: '#0f172a', lineHeight: 22 },
  sourceName: { color: '#0f172a', fontWeight: '600', marginTop: 8 },
  sourceUrl: { color: Colors.light.tint, fontSize: 13 },
  hashtags: { color: Colors.light.tint, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1 },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(10,126,164,0.4)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: Colors.light.tint, fontWeight: '700', fontSize: 16 },
  copiedBanner: { backgroundColor: '#22c55e', padding: 10, borderRadius: 8 },
  copiedText: { color: 'white', textAlign: 'center' },
  emptyState: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  emptySubtitle: { color: '#475467', textAlign: 'center' },
});
