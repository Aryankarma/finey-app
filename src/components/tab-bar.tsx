import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAccent } from '@/hooks/use-accent';
import { Icon, type IconName } from '@/ui/icons';
import { colors, layout, type } from '@/ui/theme';

const tabs: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Home', icon: 'home' },
  spending: { label: 'Spending', icon: 'spending' },
  ledger: { label: 'Ledger', icon: 'ledger' },
  people: { label: 'People', icon: 'people' },
  wealth: { label: 'Wealth', icon: 'wealth' },
};

export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const accent = useAccent();
  return (
    <View style={[styles.bar, { height: layout.tabBarHeight + insets.bottom, paddingBottom: 8 + insets.bottom }]} role="tablist">
      {state.routes.map((route, index) => {
        const tab = tabs[route.name];
        if (!tab) return null;
        const focused = index === state.index;
        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };
        return (
          <Pressable key={route.key} onPress={onPress} style={styles.item} role="tab" aria-selected={focused}>
            {({ pressed }) => (
              <>
                {focused && <View style={[styles.indicator, { backgroundColor: accent.iris }]} />}
                <Icon name={tab.icon} size={22} color={focused ? accent.lilac : pressed ? colors.text : colors.textFaint} />
                <Text style={[styles.label, { color: focused || pressed ? colors.text : colors.textFaint }]}>{tab.label}</Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  label: type.tabLabel,
});
