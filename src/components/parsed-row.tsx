import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAccent } from '@/hooks/use-accent';
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
  onEdit,
}: {
  entry: ParsedEntry;
  on: boolean;
  today: string;
  onToggle: () => void;
  warning?: { text: string; bad?: boolean };
  card?: boolean;
  onEdit?: () => void;
}) {
  const accent = useAccent();
  const ok = entry.amount > 0;
  const when = entry.date === today ? 'Today' : shortDay(entry.date);

  const box = (
    <View style={[styles.box, on && { backgroundColor: accent.iris, borderColor: accent.iris }, !ok && { borderColor: colors.lineStrong }]}>
      {on && <Icon name="check" size={14} color="#FFFFFF" strokeWidth={2.6} />}
    </View>
  );
  const dim = !on && { opacity: card ? 0.62 : 0.38 };

  // With onEdit, the box ticks and the rest of the row opens the entry to change it.
  if (onEdit) {
    return (
      <View style={{ marginBottom: card ? 10 : 0 }}>
        <View style={card ? styles.card : styles.plain}>
          <Pressable role="checkbox" aria-checked={on} aria-disabled={!ok} accessibilityLabel={`Include ${entry.name}`} onPress={() => ok && onToggle()} hitSlop={10}>
            {box}
          </Pressable>
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={`${entry.name}. Change it`}
            style={({ pressed }) => [styles.editArea, dim, pressed && { transform: [{ scale: 0.99 }] }]}>
            <Details entry={entry} when={when} on={on} card={card} />
          </Pressable>
        </View>
        {warning && <Text style={[styles.warning, { color: warning.bad ? colors.rose : accent.lilacSoft }]}>{warning.text}</Text>}
      </View>
    );
  }

  return (
    <View style={{ marginBottom: card ? 10 : 0 }}>
      <Pressable
        role="checkbox"
        aria-checked={on}
        aria-disabled={!ok}
        onPress={() => ok && onToggle()}
        style={({ pressed }) => [card ? styles.card : styles.plain, dim, pressed && ok && { transform: [{ scale: 0.99 }] }]}>
        {box}
        <Details entry={entry} when={when} on={on} card={card} />
      </Pressable>
      {warning && <Text style={[styles.warning, { color: warning.bad ? colors.rose : accent.lilacSoft }]}>{warning.text}</Text>}
    </View>
  );
}

// Category glyph, name, category and day, and the signed amount.
function Details({ entry, when, on, card }: { entry: ParsedEntry; when: string; on: boolean; card: boolean }) {
  const c = categories[entry.category];
  const ok = entry.amount > 0;
  const income = entry.type === 'income';
  return (
    <>
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
    </>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: colors.surface1 },
  plain: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 68 },
  box: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#3A3A42', alignItems: 'center', justifyContent: 'center' },
  glyph: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  amount: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, ...tabular },
  struck: { textDecorationLine: 'line-through' },
  editArea: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  warning: { marginTop: 8, marginHorizontal: 6, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
});
