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

import { colors, fonts } from '@/ui/theme';

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, text: colors.text, primary: colors.iris },
};

export default function RootLayout() {
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

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="entry" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </ThemeProvider>
  );
}
