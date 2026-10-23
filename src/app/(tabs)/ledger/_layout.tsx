import { Stack } from 'expo-router';

import { colors } from '@/ui/theme';

export default function LedgerLayout() {
  // List and Calendar swap in place, like tabs.
  return <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colors.bg } }} />;
}
