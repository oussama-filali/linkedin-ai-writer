import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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

  const handleSchedule = () => {
    Alert.alert('Programmation bientôt', 'La publication directe arrive dans la prochaine itération.');
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
        <Pressable style={[styles.secondaryButton, styles.actionButton]} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Fermer</Text>
        </Pressable>
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
