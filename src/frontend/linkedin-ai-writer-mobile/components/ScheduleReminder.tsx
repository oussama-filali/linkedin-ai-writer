import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { getBestSlots, type TimeSlot } from '@/services/timing-service';

/**
 * Composant de programmation d'un RAPPEL de publication.
 *
 * Stratégie : on ne publie pas automatiquement (l'API LinkedIn d'écriture est
 * trop restreinte). À la place, on programme une notification locale à l'heure
 * choisie : "c'est l'heure de poster". L'utilisateur ouvre, copie, colle sur
 * LinkedIn. Les créneaux proposés sont les meilleurs moments en heure LOCALE.
 *
 * @param type - type de post (pour adapter les créneaux)
 * @param text - le texte à rappeler (post + hashtags), pré-composé par le parent
 */
export function ScheduleReminder({ type, text }: { type?: string; text: string }) {
  // Créneaux recommandés en heure locale, recalculés selon le type.
  const slots = useMemo(() => getBestSlots(type), [type]);
  const [selected, setSelected] = useState<TimeSlot | null>(slots[0] ?? null);
  const [scheduled, setScheduled] = useState<string | null>(null);

  // Programme une notification locale à la date du créneau choisi.
  const schedule = async (slot: TimeSlot) => {
    try {
      // Import dynamique : module optionnel, non bloquant si indisponible.
      // @ts-ignore - module Expo optionnel
      const Notifications: any = await import('expo-notifications');
      if (!Notifications?.scheduleNotificationAsync) {
        Alert.alert('Indisponible', 'Les rappels nécessitent un build de développement.');
        return;
      }

      // Demander la permission si nécessaire.
      const perms = await Notifications.getPermissionsAsync();
      if (!perms.granted) {
        const ask = await Notifications.requestPermissionsAsync();
        if (!ask.granted) {
          Alert.alert('Permission requise', 'Active les notifications pour recevoir le rappel.');
          return;
        }
      }

      if (Notifications.setNotificationHandler) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "C'est l'heure de poster sur LinkedIn",
          body: 'Ton post est prêt. Ouvre l\'app pour le copier et le publier.',
          data: { text },
        },
        trigger: new Date(slot.iso),
      });

      setScheduled(slot.label);
    } catch {
      Alert.alert('Échec', 'Impossible de programmer le rappel.');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Programmer un rappel</Text>
      <Text style={styles.helper}>
        Choisis un créneau (heure locale). Tu recevras une notification pour publier au bon moment.
      </Text>

      <View style={styles.slotRow}>
        {slots.map((slot) => (
          <Pressable
            key={slot.iso}
            onPress={() => setSelected(slot)}
            style={({ pressed }) => [
              styles.slot,
              selected?.iso === slot.iso && styles.slotSelected,
              pressed && { opacity: 0.7 },
            ]}>
            <Text
              style={[styles.slotText, selected?.iso === slot.iso && styles.slotTextSelected]}>
              {slot.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => selected && schedule(selected)}
        disabled={!selected}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }, !selected && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>Me rappeler à ce créneau</Text>
      </Pressable>

      {scheduled ? (
        <View style={styles.confirm}>
          <Text style={styles.confirmText}>✅ Rappel programmé · {scheduled}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  slot: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(10,126,164,0.08)',
  },
  slotSelected: { backgroundColor: Colors.light.tint },
  slotText: { color: Colors.light.text, fontWeight: '500', fontSize: 13 },
  slotTextSelected: { color: '#fff' },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700' },
  confirm: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 10,
    padding: 10,
  },
  confirmText: { color: '#15803d', fontWeight: '600', textAlign: 'center' },
});
