import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  useFonts,
} from '@expo-google-fonts/archivo';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useAccent } from '@/hooks/use-accent';
import { usePinStatus } from '@/store/pin';
import { colors, fonts } from '@/ui/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const accent = useAccent();
  const navTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, text: colors.text, primary: accent.iris },
  };
  // The Expanded names use the normal cut until the Archivo Expanded TTFs are added to assets/fonts.
  const [loaded] = useFonts({
    [fonts.regular]: Archivo_400Regular,
    [fonts.medium]: Archivo_500Medium,
    [fonts.semibold]: Archivo_600SemiBold,
    [fonts.bold]: Archivo_700Bold,
    [fonts.expandedMedium]: Archivo_500Medium,
    [fonts.expandedSemibold]: Archivo_600SemiBold,
    [fonts.expandedBold]: Archivo_700Bold,
  });

  // Finey doesn't open until there's a PIN; the first open goes to Welcome to set one.
  const pinStatus = usePinStatus((s) => s.status);
  useEffect(() => {
    usePinStatus.getState().check();
  }, []);
  const ready = loaded && pinStatus !== 'checking';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const hasPin = pinStatus === 'set';
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={hasPin}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="entry" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="people" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="wealth" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="settings" />
        </Stack.Protected>
        <Stack.Protected guard={!hasPin}>
          <Stack.Screen name="welcome" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
