import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components/tab-bar';
import { colors } from '@/ui/theme';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="spending" />
      <Tabs.Screen name="ledger" />
      <Tabs.Screen name="people" />
      <Tabs.Screen name="wealth" />
    </Tabs>
  );
}
