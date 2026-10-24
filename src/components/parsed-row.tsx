import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ParsedEntry } from '@/store/parse-entries';
import { categories } from '@/ui/categories';
import { formatMoney, shortDay } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, tabular } from '@/ui/theme';

// One found entry with a tick box, for Paste text and Voice entry. Rows without an amount can't be ticked.
export function ParsedRow({
  entry,
  on,
  today,
  onToggle,
  warning,
  card = true,
}: {
  entry: ParsedEntry;
  on: boolean;
  today: string;
  onToggle: () => void;
  warning?: { text: string; bad?: boolean };
  card?: boolean;
}) {
  const c = categories[entry.category];
  const ok = entry.amount > 0;
  const income = entry.type === 'income';
  const when = entry.date === today ? 'Today' : shortDay(entry.date);

  return (
    <View style={{ marginBottom: card ? 10 : 0 }}>
      <Pressable
        role="checkbox"
        aria-checked={on}
        aria-disabled={!ok}
        onPress={() => ok && onToggle()}
        style={({ pressed }) => [card ? styles.card : styles.plain, !on && { opacity: card ? 0.62 : 0.38 }, pressed && ok && { transform: [{ scale: 0.99 }] }]}>
        <View style={[styles.box, on && styles.boxOn, !ok && { borderColor: colors.lineStrong }]}>
          {on && <Icon name="check" size={14} color="#FFFFFF" strokeWidth={2.6} />}
        </View>
        <View style={styles.glyph}>
          <Icon name={c.icon} size={18} color={c.color} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={styles.name} numberOfLines={1}>{entry.name}</Text>
          <Text style={styles.meta}>
            {c.label}, {when}
          </Text>
        </View>
        <Text style={[styles.amount, !ok ? { color: colors.rose } : income && { color: colors.mint }, !on && !card && styles.struck]}>
          {ok ? formatMoney(income ? entry.amount : -entry.amount, { signed: true }) : 'No amount'}
        </Text>
      </Pressable>
      {warning && <Text style={[styles.warning, warning.bad && { color: colors.rose }]}>{warning.text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: colors.surface1 },
  plain: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 68 },
  box: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#3A3A42', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.iris, borderColor: colors.iris },
  glyph: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  amount: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, ...tabular },
  struck: { textDecorationLine: 'line-through' },
  warning: { marginTop: 8, marginHorizontal: 6, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.lilacSoft },
});
