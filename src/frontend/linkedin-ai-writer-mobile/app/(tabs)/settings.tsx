import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { UserPreferences, getUserPreferences, updateUserPreferences } from '@/services/preferences-service';

const DEFAULT_PREFS: UserPreferences = {
  pushEnabled: true,
  factCheckEnabled: true,
};

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
      <Text style={styles.pageTitle}>Profil & préférences</Text>
      <Text style={styles.pageSubtitle}>Gère ton compte et tes rappels de publication.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <View style={styles.profileRow}>
          {/* Photo de profil (LinkedIn/Supabase), avec repli sur les initiales */}
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>
              {isAuthenticated ? user?.name ?? 'Profil' : 'Aucun compte connecté'}
            </Text>
            {isAuthenticated && user?.email ? (
              <Text style={styles.profileEmail}>{user.email}</Text>
            ) : null}
            {isAuthenticated && user?.headline ? (
              <Text style={styles.profileEmail}>{user.headline}</Text>
            ) : null}
          </View>
        </View>
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
          title="Rappels de publication"
          description="Reçois une notification au créneau choisi pour publier"
          value={preferences.pushEnabled}
          onChange={(value) => updatePreference({ pushEnabled: value })}
          disabled={!isAuthenticated}
        />
        <SettingRow
          title="Alerte fact-check"
          description="Sois prévenu si un post contient une info à vérifier"
          value={preferences.factCheckEnabled}
          onChange={(value) => updatePreference({ factCheckEnabled: value })}
          disabled={!isAuthenticated}
        />
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: 20,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  profileEmail: {
    color: '#475467',
    fontSize: 13,
    marginTop: 2,
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
  hintText: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
