import { Stack } from 'expo-router';

import { colors } from '@/ui/theme';

export default function SettingsLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
