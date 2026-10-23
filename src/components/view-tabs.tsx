import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, space } from '@/ui/theme';

// Underlined text tabs under a screen title (Ledger: List / Calendar, Spending: Breakdown / Trends).
export function ViewTabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
}: {
  label: string;
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.tabs} role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <Pressable key={t.key} role="tab" aria-selected={value === t.key} onPress={() => value !== t.key && onChange(t.key)} style={styles.tab}>
          <Text style={[styles.label, value === t.key && { color: colors.text }]}>{t.label}</Text>
          {value === t.key && <View style={styles.underline} />}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 28, paddingHorizontal: space.screenX, borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { height: 44, justifyContent: 'center' },
  label: { fontFamily: fonts.medium, fontSize: 15, color: colors.textFaint },
  underline: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, borderRadius: 2, backgroundColor: colors.iris },
});
