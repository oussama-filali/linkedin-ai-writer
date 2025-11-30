import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';
import { PostListItem, fetchPostsHistory } from '@/services/post-service';

export default function HistoryScreen() {
  const { token, isAuthenticated } = useAuth();

  const postsQuery = useQuery({
    queryKey: ['posts-history', token],
    queryFn: () => fetchPostsHistory(undefined, token),
    enabled: Boolean(token),
  });

  const posts = postsQuery.data ?? [];
  const showEmpty = isAuthenticated && !postsQuery.isLoading && posts.length === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Historique & statut</Text>
      <Text style={styles.pageSubtitle}>
        Chaque carte résume le dernier brouillon généré, son ton et ses performances estimées.
      </Text>

      {!isAuthenticated && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Connexion requise</Text>
          <Text style={styles.emptySubtitle}>Connecte-toi pour synchroniser tes posts générés.</Text>
        </View>
      )}

      {postsQuery.isLoading && isAuthenticated ? (
        <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={isAuthenticated ? posts : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 14, paddingBottom: 48 }}
          renderItem={({ item }) => (
            <HistoryCard
              item={item}
              onView={() => router.push({ pathname: '/preview', params: { id: item.id } })}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={postsQuery.isFetching} onRefresh={() => postsQuery.refetch()} />
          }
          ListEmptyComponent={
            showEmpty ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Aucun post pour l’instant</Text>
                <Text style={styles.emptySubtitle}>Crée ton premier post depuis l’onglet Générer.</Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function HistoryCard({
  item,
  onView,
}: {
  item: PostListItem;
  onView: () => void;
}) {
  const statusCopy = getStatusCopy(item.status);
  const engagement =
    item.factCheckStatus === 'flagged'
      ? '⛔ Fact-check requis'
      : item.factCheckStatus === 'pending'
        ? 'Analyse en cours'
        : 'Fact-check validé';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>{formatDateLabel(item)}</Text>
        </View>
        <View style={[styles.statusPill, statusStyles(item.status)]}>
          <Text style={styles.statusText}>{statusCopy}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.tag}>Ton · {item.tone}</Text>
        <Text style={styles.tag}>{engagement}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Pressable style={({ pressed }) => [styles.cardButton, pressed && { opacity: 0.75 }]} onPress={onView}>
          <Text style={styles.cardButtonText}>Voir le post</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.cardButtonGhost, pressed && { opacity: 0.6 }]}
          onPress={() => Alert.alert('Planning à venir', 'La reprogrammation arrivera bientôt.')}
        >
          <Text style={styles.cardButtonGhostText}>Planifier bientôt</Text>
        </Pressable>
      </View>
    </View>
  );
}

function getStatusCopy(status: PostListItem['status']) {
  switch (status) {
    case 'published':
      return 'Publié';
    case 'draft':
      return 'Brouillon';
    case 'blocked':
      return 'Bloqué';
    default:
      return 'Brouillon';
  }
}

function statusStyles(status: PostListItem['status']) {
  switch (status) {
    case 'published':
      return { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)' };
    case 'draft':
      return { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.4)' };
    case 'blocked':
      return { backgroundColor: 'rgba(250,204,21,0.16)', borderColor: 'rgba(250,204,21,0.4)' };
    default:
      return { backgroundColor: 'rgba(148,163,184,0.12)', borderColor: 'rgba(148,163,184,0.3)' };
  }
}

function formatDateLabel(item: PostListItem) {
  const date = new Date(item.createdAt);
  return date.toLocaleString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 20,
    gap: 14,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0b1831',
  },
  pageSubtitle: {
    color: '#475467',
    marginBottom: 6,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptySubtitle: {
    color: '#475467',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardMeta: {
    color: '#475467',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: '600',
    color: '#0f172a',
  },
  cardBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.05)',
    color: '#0f172a',
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  cardButton: {
    flex: 1,
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cardButtonGhost: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(10,126,164,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonGhostText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
});
