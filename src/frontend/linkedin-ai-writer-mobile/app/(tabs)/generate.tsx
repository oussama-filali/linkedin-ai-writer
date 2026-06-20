import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { usePostDraftStore } from '@/stores/post-draft-store';
import {
  GeneratePostPayload,
  PostType,
  ProfileSummary,
  fetchPostTypes,
  generatePost,
} from '@/services/post-service';

// Fallback si l'API /types n'est pas joignable (rétrocompat).
const FALLBACK_TYPES: PostType[] = [
  { type: 'storytelling', label: 'Storytelling', needsComment: false },
  { type: 'performance', label: 'Performance', needsComment: false },
  { type: 'reponse_commentaire', label: 'Réponse à un commentaire', needsComment: true },
  { type: 'conseil', label: 'Conseil', needsComment: false },
];

export default function GenerateScreen() {
  const { token, isAuthenticated } = useAuth();
  const setDraft = usePostDraftStore((state) => state.setDraft);

  // 1) Les types viennent du backend (entonnoir). Fallback si indisponible.
  const typesQuery = useQuery({
    queryKey: ['post-types', token],
    queryFn: () => fetchPostTypes(token),
  });
  const types = typesQuery.data?.length ? typesQuery.data : FALLBACK_TYPES;

  const [selectedType, setSelectedType] = useState<string>('storytelling');
  const [context, setContext] = useState(''); // qui parle (profil/contexte)
  const [message, setMessage] = useState(''); // ce que la personne veut dire (champ libre)
  const [comment, setComment] = useState(''); // commentaire à répondre (si type le demande)

  const currentType = types.find((t) => t.type === selectedType) ?? types[0];
  const needsComment = Boolean(currentType?.needsComment);

  const mutation = useMutation({
    mutationFn: (payload: GeneratePostPayload) => generatePost(payload, token),
    onSuccess: (draft) => {
      setDraft(draft);
      router.push('/preview');
    },
    onError: (error: Error) => {
      Alert.alert('Génération impossible', error.message);
    },
  });

  const formReady =
    message.trim().length >= 10 && (!needsComment || comment.trim().length >= 5);

  const handleGenerate = () => {
    if (!isAuthenticated) {
      Alert.alert('Connexion requise', 'Connecte ton compte pour générer un post.');
      return;
    }
    if (!formReady) {
      Alert.alert(
        'Encore un peu',
        needsComment
          ? 'Colle le commentaire à répondre et décris ce que tu veux dire.'
          : 'Décris en quelques mots ce que tu veux raconter.'
      );
      return;
    }

    const profile: ProfileSummary = {
      role: 'utilisateur LinkedIn',
      summary: context.trim() || undefined,
    };

    const payload: GeneratePostPayload = {
      type: selectedType,
      resume: context.trim() || message.trim(),
      objectif: message.trim(),
      comment: needsComment ? comment.trim() : undefined,
      profile,
    };

    mutation.mutate(payload);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Créer un post</Text>
      <Text style={styles.pageSubtitle}>
        Choisis le type, dis ce que tu veux raconter. L'IA écrit, vérifie et source.
      </Text>

      {/* 1. Type de post (entonnoir) */}
      <SectionCard title="Type de post">
        {typesQuery.isLoading ? (
          <ActivityIndicator color={Colors.light.tint} />
        ) : (
          <View style={styles.chipRow}>
            {types.map((t) => (
              <Chip
                key={t.type}
                label={t.label}
                selected={selectedType === t.type}
                onPress={() => setSelectedType(t.type)}
              />
            ))}
          </View>
        )}
      </SectionCard>

      {/* 2. Commentaire à répondre (seulement si le type le demande) */}
      {needsComment && (
        <SectionCard title="Le commentaire à répondre">
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Colle ici le commentaire reçu…"
            style={[styles.input, styles.inputTall]}
            multiline
          />
        </SectionCard>
      )}

      {/* 3. Le message (champ libre principal) */}
      <SectionCard title={needsComment ? 'Ce que tu veux répondre' : 'Ce que tu veux dire'}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={
            needsComment
              ? 'En quelques mots, l’angle de ta réponse…'
              : 'Raconte ton idée, ton vécu, ton angle (un bug, une réflexion, une victoire…)'
          }
          style={[styles.input, styles.inputTall]}
          multiline
        />
      </SectionCard>

      {/* 4. Contexte / qui parle (optionnel) */}
      <SectionCard title="Toi (optionnel)">
        <Text style={styles.helper}>
          Quelques mots sur ton métier / ta situation pour personnaliser la voix.
        </Text>
        <TextInput
          value={context}
          onChangeText={setContext}
          placeholder="Ex : développeur en reconversion, artisan, étudiant en santé…"
          style={styles.input}
          multiline
        />
      </SectionCard>

      <Pressable
        onPress={handleGenerate}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && { opacity: 0.85 },
          (!formReady || mutation.isPending) && styles.primaryButtonDisabled,
        ]}
        disabled={mutation.isPending || !formReady}>
        {mutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Générer le post</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && !selected && { opacity: 0.7 },
      ]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { padding: 20, paddingBottom: 48, gap: 18 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#0b1831' },
  pageSubtitle: { fontSize: 15, color: '#4a5568', marginBottom: 6 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    gap: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#142033' },
  helper: { fontSize: 13, color: '#6b7280' },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fbfbfd',
    minHeight: 48,
    fontSize: 15,
  },
  inputTall: { minHeight: 110, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 126, 164, 0.08)',
  },
  chipSelected: { backgroundColor: Colors.light.tint },
  chipText: { color: Colors.light.text, fontWeight: '500' },
  chipTextSelected: { color: '#fff' },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 18,
    marginTop: 8,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
