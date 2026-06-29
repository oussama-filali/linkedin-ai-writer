
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import SplashScreen from '../components/SplashScreen';
import { AuthProvider } from '@/hooks/use-auth';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (Platform.OS === 'web') return;
        // Dynamically import to avoid bundling on web
        // @ts-ignore - available after installing expo-notifications
        const Notifications: any = await import('expo-notifications');

        // Handler global : un rappel doit être VISIBLE et SONORE pour ne pas être manqué.
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        // Demande de permission (obligatoire pour afficher des notifications).
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }

        // Channel Android (obligatoire Android 8+). HIGH = la notif apparaît
        // bien à l'écran avec son, indispensable pour un rappel de publication.
        if (mounted && Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Rappels de publication',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
          });
        }
      } catch (e) {
        // no-op: notifications are optional
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <SplashScreen onFinish={() => setLoading(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="login"
              options={{ presentation: 'modal', title: 'Connexion' }}
            />
            <Stack.Screen name="preview" options={{ title: 'Prévisualisation' }} />
            <Stack.Screen name="privacy" options={{ title: 'Confidentialité' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
