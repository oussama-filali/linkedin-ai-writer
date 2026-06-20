import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { improvePost } from '@/services/post-service';

/**
 * Composant de MODIFICATION d'un post.
 *
 * L'utilisateur décrit ce qu'il veut changer (ex: "plus court", "plus direct",
 * "enlève la dernière phrase"), et l'IA réécrit le post en gardant la voix.
 * Fonctionne pour tout post ayant un id (brouillon généré ou historique).
 *
 * @param postId - identifiant du post à modifier
 * @param onUpdated - callback appelé avec le nouveau texte après modification
 */
export function EditPost({ postId, onUpdated }: { postId: string; onUpdated: (newText: string) => void }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const mutation = useMutation({
    mutationFn: () => improvePost(postId, feedback.trim(), token),
    onSuccess: (data) => {
      onUpdated(data.post);
      setFeedback('');
      setOpen(false);
    },
    onError: (error: Error) => {
      Alert.alert('Modification impossible', error.message);
    },
  });

  // Bouton fermé : on affiche juste l'entrée "Modifier".
  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.openButton, pressed && { opacity: 0.7 }]}>
        <Text style={styles.openButtonText}>✏️ Modifier ce post</Text>
      </Pressable>
    );
  }

  const ready = feedback.trim().length >= 3;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Modifier le post</Text>
      <Text style={styles.helper}>
        Dis ce que tu veux changer (ex : « plus court », « plus direct », « enlève la fin »).
      </Text>
      <TextInput
        value={feedback}
        onChangeText={setFeedback}
        placeholder="Ce que tu veux ajuster…"
        style={styles.input}
        multiline
      />
      <View style={styles.actions}>
        <Pressable
          onPress={() => ready && mutation.mutate()}
          disabled={!ready || mutation.isPending}
          style={({ pressed }) => [
            styles.applyButton,
            pressed && { opacity: 0.85 },
            (!ready || mutation.isPending) && styles.disabled,
          ]}>
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.applyText}>Appliquer</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => {
            setOpen(false);
            setFeedback('');
          }}
          style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.7 }]}>
          <Text style={styles.cancelText}>Annuler</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  openButton: {
    borderWidth: 1,
    borderColor: 'rgba(10,126,164,0.4)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  openButtonText: { color: Colors.light.tint, fontWeight: '700', fontSize: 15 },
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
  helper: { fontSize: 13, color: '#6b7280' },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fbfbfd',
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  applyButton: {
    flex: 1,
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(10,126,164,0.4)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { color: Colors.light.tint, fontWeight: '700' },
});
