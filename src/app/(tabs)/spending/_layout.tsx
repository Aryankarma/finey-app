import { Stack } from 'expo-router';

import { colors } from '@/ui/theme';

export default function SpendingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      {/* Breakdown and Trends swap in place like tabs; a category pushes normally. */}
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="trends" options={{ animation: 'none' }} />
    </Stack>
  );
}
