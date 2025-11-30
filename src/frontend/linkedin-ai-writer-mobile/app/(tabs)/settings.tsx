import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { UserPreferences, getUserPreferences, updateUserPreferences } from '@/services/preferences-service';

const DEFAULT_PREFS: UserPreferences = {
  pushEnabled: true,
  autoPostEnabled: false,
  factCheckEnabled: true,
  notifyBeforeDefault: true,
  defaultSlot: null,
};

export default function SettingsScreen() {
  const { user, isAuthenticated, logout, token } = useAuth();
  const queryClient = useQueryClient();

  const preferencesQuery = useQuery({
    queryKey: ['user-preferences', token],
    queryFn: () => getUserPreferences(token),
    enabled: Boolean(token),
    initialData: DEFAULT_PREFS,
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<UserPreferences>) => updateUserPreferences(patch, token),
    onSuccess: (next) => {
      queryClient.setQueryData(['user-preferences', token], next);
    },
    onError: (error: Error) => {
      console.warn('Préférences non sauvegardées', error);
    },
  });

  const preferences = preferencesQuery.data ?? DEFAULT_PREFS;

  const updatePreference = (patch: Partial<UserPreferences>) => {
    queryClient.setQueryData<UserPreferences>(['user-preferences', token], (prev) => ({
      ...(prev ?? DEFAULT_PREFS),
      ...patch,
    }));
    mutation.mutate(patch);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Préférences & sécurité</Text>
      <Text style={styles.pageSubtitle}>Ajuste les rappels, l’automatisation et ta connexion LinkedIn.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Compte LinkedIn</Text>
        <Text style={styles.sectionSubtitle}>
          {isAuthenticated
            ? `${user?.name ?? 'Profil Supabase'}${user?.headline ? ` — ${user.headline}` : ''}`
            : 'Aucun compte connecté'}
        </Text>
        <Pressable
          onPress={isAuthenticated ? logout : undefined}
          style={({ pressed }) => [styles.outlineButton, pressed && { opacity: 0.7 }]}
          disabled={!isAuthenticated}>
          <Text style={styles.outlineButtonText}>{isAuthenticated ? 'Se déconnecter' : 'Connecte-toi depuis Home'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingRow
          title="Recevoir des push"
          description="Résumés quotidiens, rappels avant envoi"
          value={preferences.pushEnabled}
          onChange={(value) => updatePreference({ pushEnabled: value })}
          disabled={!isAuthenticated}
        />
        <SettingRow
          title="Alerte critique"
          description="Notifie si un post est bloqué par le fact-check"
          value={preferences.factCheckEnabled}
          onChange={(value) => updatePreference({ factCheckEnabled: value })}
          disabled={!isAuthenticated}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Automatisation</Text>
        <SettingRow
          title="Autoriser l’auto-post"
          description="Publier sans confirmation nécessaire"
          value={preferences.autoPostEnabled}
          onChange={(value) => updatePreference({ autoPostEnabled: value })}
          disabled={!isAuthenticated}
        />
        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.6 }]}
          disabled>
          <Text style={styles.linkText}>Configurer les heures idéales</Text>
        </Pressable>
        {!isAuthenticated && (
          <Text style={styles.hintText}>Connecte-toi pour sauvegarder ces préférences.</Text>
        )}
      </View>

      {preferencesQuery.isFetching && isAuthenticated && (
        <ActivityIndicator size="small" color="#0a7ea4" />
      )}
    </ScrollView>
  );
}

function SettingRow({
  title,
  description,
  value,
  onChange,
  disabled,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={value ? '#0a7ea4' : undefined}
        disabled={disabled}
      />
    </View>
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
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0b1831',
  },
  pageSubtitle: {
    color: '#475467',
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  sectionSubtitle: {
    color: '#475467',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: 'rgba(10,126,164,0.4)',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  settingSubtitle: {
    color: '#475467',
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  hintText: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
