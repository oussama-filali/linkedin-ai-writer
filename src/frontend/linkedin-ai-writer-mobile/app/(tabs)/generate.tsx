import React, { ReactNode, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { usePostDraftStore } from '@/stores/post-draft-store';
import { GeneratePostPayload, ProfileSummary, generatePost } from '@/services/post-service';

const tones = ['professionnel', 'inspirant', 'engagé'];
const sectors = ['Tech & SaaS', 'Marketing', 'Finance', 'RH', 'Industrie'];
const domains = ['Lancement produit', 'Leadership', 'Culture d’entreprise', 'Carrière', 'IA & data'];

type LocalSlot = { label: string; iso: string };

const buildFallbackSlots = (): LocalSlot[] => {
  const now = Date.now();
  return [
    { label: 'Mardi 08:30', iso: new Date(now + 2 * 60 * 60 * 1000).toISOString() },
    { label: 'Jeudi 11:45', iso: new Date(now + 3 * 60 * 60 * 1000).toISOString() },
    { label: 'Dimanche 18:10', iso: new Date(now + 5 * 60 * 60 * 1000).toISOString() },
  ];
};

export default function GenerateScreen() {
  const fallbackSlots = useMemo(() => buildFallbackSlots(), []);
  const { token, isAuthenticated, user } = useAuth();
  const setDraft = usePostDraftStore((state) => state.setDraft);

  const [resume, setResume] = useState('');
  const [objective, setObjective] = useState('');
  const [tone, setTone] = useState<typeof tones[number]>('professionnel');
  const [sector, setSector] = useState(sectors[0]);
  const [domain, setDomain] = useState(domains[0]);
  const [audience, setAudience] = useState('Opérations marketing Europe');
  const [autoPublish, setAutoPublish] = useState(false);
  const [notifyBefore, setNotifyBefore] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<LocalSlot | null>(fallbackSlots[0]);
  const [customSlotIso, setCustomSlotIso] = useState<string | null>(null);

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

  const formReady = resume.trim().length >= 20 && objective.trim().length >= 20;

  const handleGenerate = () => {
    if (!isAuthenticated) {
      Alert.alert('Connexion requise', 'Connecte ton compte pour générer un post.');
      return;
    }
    if (!formReady) {
      Alert.alert('Brief incomplet', 'Renseigne un résumé et un objectif détaillés.');
      return;
    }

    const profile: ProfileSummary = {
      // Description volontairement générique pour rester RGPD-friendly
      role: 'utilisateur LinkedIn',
      sector,
      targetAudience: audience.trim() || undefined,
      preferredStyle: tone,
      summary: resume.trim(),
    };

    const payload: GeneratePostPayload = {
      resume: resume.trim(),
      objectif: objective.trim(),
      ton: tone,
      sujet: `${sector} • ${domain} • ${audience}`,
      profile,
      meta: {
        audience: audience.trim(),
        sector,
        domain,
        autoPublish,
        notifyBefore,
        slot: customSlotIso ?? selectedSlot?.iso ?? null,
      },
    };

    mutation.mutate(payload);
  };

  const handleCustomSlot = () => {
    const iso = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    setCustomSlotIso(iso);
    setSelectedSlot(null);
    Alert.alert('Créneau personnalisé ajouté', formatSlotLabel(iso));
  };

  const currentSlotLabel = customSlotIso
    ? formatSlotLabel(customSlotIso)
    : selectedSlot?.label ?? '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Brief & génération</Text>
      <Text style={styles.pageSubtitle}>
        Remplis les infos clés, choisis ton secteur puis programme l’envoi avec rappel.
      </Text>

      <SectionCard title="Profil & objectif">
        <TextInput
          value={resume}
          onChangeText={setResume}
          placeholder="Résumé rapide de ton expertise"
          style={styles.input}
          multiline
        />
        <TextInput
          value={objective}
          onChangeText={setObjective}
          placeholder="But du post (ex: annoncer une bêta, partager un apprentissage)"
          style={[styles.input, { marginTop: 12 }]}
          multiline
        />
        <Text style={styles.label}>Choisis le ton</Text>
        <View style={styles.chipRow}>
          {tones.map((item) => (
            <Chip key={item} label={item} selected={tone === item} onPress={() => setTone(item)} />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Secteur & focus">
        <Text style={styles.label}>Secteur</Text>
        <View style={styles.chipRow}>
          {sectors.map((item) => (
            <Chip key={item} label={item} selected={sector === item} onPress={() => setSector(item)} />
          ))}
        </View>
        <Text style={[styles.label, { marginTop: 16 }]}>Domaine</Text>
        <View style={styles.chipRow}>
          {domains.map((item) => (
            <Chip key={item} label={item} selected={domain === item} onPress={() => setDomain(item)} />
          ))}
        </View>
        <TextInput
          value={audience}
          onChangeText={setAudience}
          placeholder="Audience ciblée (ex: Directors Marketing France)"
          style={[styles.input, { marginTop: 16 }]}
        />
      </SectionCard>

      <SectionCard title="Programmation intelligente">
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleTitle}>Publier automatiquement</Text>
            <Text style={styles.toggleSubtitle}>Le post partira sans action si tu l’autorises.</Text>
          </View>
          <Switch value={autoPublish} onValueChange={setAutoPublish} thumbColor={autoPublish ? '#0a7ea4' : undefined} />
        </View>
        <View style={[styles.toggleRow, { marginTop: 16 }]}>
          <View>
            <Text style={styles.toggleTitle}>Notification avant envoi</Text>
            <Text style={styles.toggleSubtitle}>Rappel push 15 min avant le créneau.</Text>
          </View>
          <Switch value={notifyBefore} onValueChange={setNotifyBefore} thumbColor={notifyBefore ? '#0a7ea4' : undefined} />
        </View>
        <Text style={[styles.label, { marginTop: 18 }]}>Heures idéales proposées</Text>
        <View style={styles.chipRow}>
          {fallbackSlots.map((slot) => (
            <Chip
              key={slot.iso}
              label={slot.label}
              selected={selectedSlot?.iso === slot.iso && !customSlotIso}
              onPress={() => {
                setSelectedSlot(slot);
                setCustomSlotIso(null);
              }}
            />
          ))}
        </View>
        <Pressable onPress={handleCustomSlot} style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.6 }]}>
          <Text style={styles.linkText}>Choisir un autre créneau</Text>
        </Pressable>
        <Text style={styles.currentSlot}>Créneau actuel · {currentSlotLabel}</Text>
      </SectionCard>

      <Pressable
        onPress={handleGenerate}
        style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }, (!formReady || mutation.isPending) && styles.primaryButtonDisabled]}
        disabled={mutation.isPending || !formReady}>
        <Text style={styles.primaryButtonText}>
          {mutation.isPending ? 'Génération en cours…' : 'Générer le post'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
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
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 18,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0b1831',
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#4a5568',
    marginBottom: 6,
  },
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#142033',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fbfbfd',
    minHeight: 48,
  },
  label: {
    fontSize: 13,
    textTransform: 'uppercase',
    color: '#6b7280',
    letterSpacing: 0.6,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 126, 164, 0.08)',
  },
  chipSelected: {
    backgroundColor: Colors.light.tint,
  },
  chipText: {
    color: Colors.light.text,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  toggleSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  linkButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  linkText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  currentSlot: {
    marginTop: 4,
    color: '#0f172a',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 18,
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

function formatSlotLabel(iso: string) {
  const date = new Date(iso);
  try {
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    return formatter.format(date);
  } catch {
    return date.toLocaleString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
