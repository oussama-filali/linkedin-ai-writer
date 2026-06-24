import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { getBestSlots, type TimeSlot } from '@/services/timing-service';

/**
 * Composant de programmation d'un RAPPEL de publication.
 *
 * Stratégie : on ne publie pas automatiquement (l'API LinkedIn d'écriture est
 * trop restreinte). On programme une notification locale à l'heure choisie :
 * "c'est l'heure de poster". L'utilisateur ouvre, copie, colle sur LinkedIn.
 *
 * L'UTILISATEUR contrôle son créneau :
 *   - soit via les créneaux suggérés (raccourcis recommandés, heure locale),
 *   - soit en réglant LIBREMENT la date, l'heure et les minutes.
 * Le sélecteur libre fonctionne aussi bien sur le web que sur mobile (pas de
 * dépendance native), et permet de tester en mettant un rappel proche.
 *
 * @param type - type de post (pour adapter les créneaux suggérés)
 * @param text - le texte à rappeler (post + hashtags), pré-composé par le parent
 */
export function ScheduleReminder({ type, text }: { type?: string; text: string }) {
  // Créneaux suggérés en heure locale, recalculés selon le type.
  const suggested = useMemo(() => getBestSlots(type), [type]);

  // Mode de sélection : 'suggestion' (raccourcis) ou 'custom' (réglage libre).
  const [mode, setMode] = useState<'suggestion' | 'custom'>('suggestion');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(suggested[0] ?? null);

  // État du sélecteur libre : on part de "dans 1h" comme valeur de départ.
  const initial = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  }, []);
  const [customDate, setCustomDate] = useState<Date>(initial);

  const [scheduled, setScheduled] = useState<string | null>(null);

  // Calcule la date finale selon le mode choisi.
  const finalDate = mode === 'custom' ? customDate : selectedSlot ? new Date(selectedSlot.iso) : null;

  // Modifie le jour du créneau libre (+/- jours).
  const shiftDay = (days: number) => {
    setCustomDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  // Modifie l'heure du créneau libre (+/- heures, avec rebouclage 0-23).
  const shiftHour = (h: number) => {
    setCustomDate((prev) => {
      const next = new Date(prev);
      next.setHours((next.getHours() + h + 24) % 24);
      return next;
    });
  };

  // Modifie les minutes du créneau libre (par pas de 5).
  const shiftMinute = (m: number) => {
    setCustomDate((prev) => {
      const next = new Date(prev);
      next.setMinutes((next.getMinutes() + m + 60) % 60);
      return next;
    });
  };

  // Programme une notification locale à la date finale.
  const schedule = async () => {
    if (!finalDate) return;

    // Sécurité : le créneau doit être dans le futur.
    if (finalDate.getTime() <= Date.now()) {
      Alert.alert('Heure invalide', 'Choisis un créneau dans le futur.');
      return;
    }

    try {
      // @ts-ignore - module Expo optionnel
      const Notifications: any = await import('expo-notifications');
      if (!Notifications?.scheduleNotificationAsync) {
        Alert.alert('Indisponible', 'Les rappels nécessitent un build de développement (pas Expo Go).');
        return;
      }

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
          sound: 'default',
        },
        // On déclenche à la date exacte, via le channel 'default' (configuré
        // dans _layout.tsx avec importance HIGH + son).
        trigger: { type: 'date', date: finalDate, channelId: 'default' },
      });

      setScheduled(formatFull(finalDate));
    } catch {
      Alert.alert('Échec', 'Impossible de programmer le rappel.');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Programmer un rappel</Text>
      <Text style={styles.helper}>
        Choisis quand publier (heure locale). Tu recevras une notification à ce moment.
      </Text>

      {/* Bascule entre créneaux suggérés et réglage libre */}
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setMode('suggestion')}
          style={[styles.tab, mode === 'suggestion' && styles.tabActive]}>
          <Text style={[styles.tabText, mode === 'suggestion' && styles.tabTextActive]}>Créneaux conseillés</Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('custom')}
          style={[styles.tab, mode === 'custom' && styles.tabActive]}>
          <Text style={[styles.tabText, mode === 'custom' && styles.tabTextActive]}>Heure personnalisée</Text>
        </Pressable>
      </View>

      {mode === 'suggestion' ? (
        <View style={styles.slotRow}>
          {suggested.map((slot) => (
            <Pressable
              key={slot.iso}
              onPress={() => setSelectedSlot(slot)}
              style={({ pressed }) => [
                styles.slot,
                selectedSlot?.iso === slot.iso && styles.slotSelected,
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={[styles.slotText, selectedSlot?.iso === slot.iso && styles.slotTextSelected]}>
                {slot.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        // Réglage libre : jour / heure / minute, via +/- (marche web + mobile)
        <View style={styles.customWrapper}>
          <Stepper label="Jour" value={formatDay(customDate)} onMinus={() => shiftDay(-1)} onPlus={() => shiftDay(1)} />
          <Stepper label="Heure" value={pad(customDate.getHours())} onMinus={() => shiftHour(-1)} onPlus={() => shiftHour(1)} />
          <Stepper label="Min" value={pad(customDate.getMinutes())} onMinus={() => shiftMinute(-5)} onPlus={() => shiftMinute(5)} />
        </View>
      )}

      {finalDate ? (
        <Text style={styles.preview}>Rappel prévu · {formatFull(finalDate)}</Text>
      ) : null}

      <Pressable
        onPress={schedule}
        disabled={!finalDate}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }, !finalDate && styles.buttonDisabled]}>
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

/** Petit sélecteur +/- réutilisable (jour, heure, minute). */
function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable onPress={onMinus} style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.6 }]}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable onPress={onPlus} style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.6 }]}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatFull(date: Date): string {
  const label = date.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
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
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(10,126,164,0.08)',
  },
  tabActive: { backgroundColor: Colors.light.tint },
  tabText: { color: Colors.light.text, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#fff' },
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
  customWrapper: { flexDirection: 'row', gap: 10, marginTop: 4 },
  stepper: { flex: 1, alignItems: 'center', gap: 6 },
  stepperLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(10,126,164,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: Colors.light.tint, fontSize: 20, fontWeight: '700' },
  stepperValue: { fontSize: 16, fontWeight: '700', color: '#0f172a', minWidth: 56, textAlign: 'center' },
  preview: { color: '#0f172a', fontWeight: '600', marginTop: 4 },
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
