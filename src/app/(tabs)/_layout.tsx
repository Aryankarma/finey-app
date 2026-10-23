import { Tabs } from 'expo-router/tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBar } from '@/components/tab-bar';
import { Toast } from '@/components/toast';
import { colors, layout } from '@/ui/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="spending" />
        <Tabs.Screen name="ledger" />
        <Tabs.Screen name="people" />
        <Tabs.Screen name="wealth" />
      </Tabs>
      <Toast bottom={layout.tabBarHeight + insets.bottom + 16} />
    </View>
  );
}
