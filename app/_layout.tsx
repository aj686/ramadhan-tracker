import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useThemeStore } from '@/store/theme-store';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const { loadPreference } = useThemeStore();

  // Load persisted theme preference on startup
  useEffect(() => {
    loadPreference();
  }, []);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      {/* Child detail screens — all use slide_from_right */}
      <Stack.Screen
        name="child/[id]/index"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="child/[id]/fasting"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="child/[id]/prayer"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="child/[id]/sunat"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="child/[id]/quran"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="child/[id]/doa"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="premium/upgrade"
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const { isDark } = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootLayoutNav />
    </SafeAreaProvider>
  );
}
