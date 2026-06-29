import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { deleteMyAccount, exportMyData } from '@/services/preferences-service';

/**
 * Écran Confidentialité & RGPD.
 *
 * Conformité : transparence sur les données collectées, consentement IA,
 * droit à la portabilité (export) et droit à l'effacement (suppression).
 */
export default function PrivacyScreen() {
  const { token, logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Export des données (droit à la portabilité RGPD).
  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportMyData(token);
      const json = JSON.stringify(data, null, 2);
      // On partage le JSON (l'utilisateur le sauvegarde où il veut).
      await Share.share({ message: json, title: 'Mes données LinkIA_Writer' });
    } catch (e) {
      Alert.alert('Export impossible', e instanceof Error ? e.message : 'Réessaie plus tard.');
    } finally {
      setExporting(false);
    }
  };

  // Suppression du compte (droit à l'effacement RGPD) — double confirmation.
  const handleDelete = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est DÉFINITIVE. Tous tes posts, préférences et données seront effacés. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteMyAccount(token);
              await logout();
              Alert.alert('Compte supprimé', 'Toutes tes données ont été effacées.');
              router.replace('/login');
            } catch (e) {
              Alert.alert('Suppression impossible', e instanceof Error ? e.message : 'Réessaie plus tard.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Confidentialité & données</Text>
      <Text style={styles.pageSubtitle}>Transparence et contrôle total sur tes données (RGPD).</Text>

      {/* Politique de confidentialité */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quelles données on utilise</Text>
        <Text style={styles.paragraph}>
          Lors de la connexion, on récupère uniquement ton <Text style={styles.bold}>nom</Text>, ton{' '}
          <Text style={styles.bold}>email</Text> et ta <Text style={styles.bold}>photo</Text> de profil.
        </Text>
        <Text style={styles.paragraph}>
          On conserve aussi les <Text style={styles.bold}>posts que tu génères</Text> (pour ton
          historique et pour personnaliser ta voix). Tes données ne sont ni vendues, ni partagées
          à des tiers à des fins publicitaires.
        </Text>
      </View>

      {/* Transparence IA (AI Act) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Génération par IA</Text>
        <Text style={styles.paragraph}>
          Les posts sont <Text style={styles.bold}>générés par une intelligence artificielle</Text>.
          Ils sont vérifiés (fact-check) et tu restes seul responsable de ce que tu publies.
          En utilisant l'app, tu consens au traitement de tes données pour cette génération.
        </Text>
      </View>

      {/* Export — droit à la portabilité */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Exporter mes données</Text>
        <Text style={styles.paragraph}>
          Récupère une copie de toutes tes données (profil, préférences, posts) au format JSON.
        </Text>
        <Pressable
          onPress={handleExport}
          disabled={exporting}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}>
          {exporting ? (
            <ActivityIndicator color={Colors.light.tint} />
          ) : (
            <Text style={styles.buttonText}>Exporter mes données</Text>
          )}
        </Pressable>
      </View>

      {/* Suppression — droit à l'effacement */}
      <View style={styles.cardDanger}>
        <Text style={styles.cardTitleDanger}>Supprimer mon compte</Text>
        <Text style={styles.paragraph}>
          Efface définitivement ton compte et toutes tes données. Cette action est irréversible.
        </Text>
        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          style={({ pressed }) => [styles.dangerButton, pressed && { opacity: 0.85 }]}>
          {deleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.dangerButtonText}>Supprimer définitivement</Text>
          )}
        </Pressable>
      </View>

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#0b1831' },
  pageSubtitle: { color: '#475467', marginBottom: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardDanger: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.25)',
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#0f172a' },
  cardTitleDanger: { fontSize: 17, fontWeight: '600', color: '#dc2626' },
  paragraph: { color: '#475467', lineHeight: 20, fontSize: 14 },
  bold: { fontWeight: '700', color: '#0f172a' },
  button: {
    borderWidth: 1,
    borderColor: 'rgba(10,126,164,0.4)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: Colors.light.tint, fontWeight: '700' },
  dangerButton: {
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  dangerButtonText: { color: '#fff', fontWeight: '700' },
  backButton: { alignItems: 'center', paddingVertical: 8 },
  backText: { color: '#475467', fontWeight: '600' },
});
