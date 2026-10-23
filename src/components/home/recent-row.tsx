import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Amount } from '@/components/amount';
import type { Entry } from '@/data/seed';
import { categories } from '@/ui/categories';
import { formatMoney, relativeDay } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, layout } from '@/ui/theme';

export function RecentRow({ entry, today, onPress }: { entry: Entry; today: string; onPress?: () => void }) {
  const category = categories[entry.category];
  const income = entry.type === 'income';
  const amount = formatMoney(income ? entry.amount : -entry.amount, { signed: true });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${entry.name}, ${category.label}, ${amount}, ${relativeDay(entry.date, today)}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface1 }]}>
      <View style={styles.glyph}>
        <Icon name={category.icon} size={18} color={category.color} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>{entry.name}</Text>
        <Text style={styles.sub}>{category.label}</Text>
      </View>
      <View style={styles.right}>
        <Amount style={[styles.amount, income && { color: colors.mint }]}>{amount}</Amount>
        <Text style={styles.date}>{relativeDay(entry.date, today)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, height: layout.rowHeight, borderRadius: 14 },
  glyph: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  right: { alignItems: 'flex-end', gap: 2 },
  amount: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  date: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
});
