import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Sheet } from '@/components/sheet';
import { addDays, dayOfMonth, daysInMonth, monthName, toIso, weekday } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, gradients, tabular } from '@/ui/theme';

const EARLIEST = { y: 2025, m: 1 }; // the boards stop at January 2025
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Month = { y: number; m: number };
const monthOf = (iso: string): Month => ({ y: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)) });
const before = (a: Month, b: Month) => a.y < b.y || (a.y === b.y && a.m < b.m);

// "today, 21 Oct", "yesterday, 20 Oct", "Monday 12 Oct" for the button label.
function pickLabel(iso: string, today: string) {
  const short = `${dayOfMonth(iso)} ${monthName(iso, 'short')}`;
  if (iso === today) return `today, ${short}`;
  if (iso === addDays(today, -1)) return `yesterday, ${short}`;
  return `${weekday(iso)} ${short}${iso.slice(0, 4) === today.slice(0, 4) ? '' : ` ${iso.slice(0, 4)}`}`;
}

export function DatePickerSheet({
  visible,
  value,
  today,
  onClose,
  onPick,
}: {
  visible: boolean;
  value: string;
  today: string;
  onClose: () => void;
  onPick: (iso: string) => void;
}) {
  const [selected, setSelected] = useState(value);
  const [view, setView] = useState(monthOf(value));
  const yesterday = addDays(today, -1);

  useEffect(() => {
    if (visible) {
      setSelected(value);
      setView(monthOf(value));
    }
  }, [visible, value]);

  const step = (delta: number) => {
    const m = view.m + delta;
    const next = m < 1 ? { y: view.y - 1, m: 12 } : m > 12 ? { y: view.y + 1, m: 1 } : { y: view.y, m };
    if (before(next, EARLIEST) || before(monthOf(today), next)) return;
    setView(next);
  };

  const jump = (iso: string) => {
    setSelected(iso);
    setView(monthOf(iso));
  };

  const firstIso = toIso(view.y, view.m, 1);
  const lead = new Date(Date.UTC(view.y, view.m - 1, 1)).getUTCDay();
  const count = daysInMonth(firstIso);
  const cells: (string | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: count }, (_, i) => toIso(view.y, view.m, i + 1)),
  ];
  while (cells.length < 42) cells.push(null);

  const atStart = view.y === EARLIEST.y && view.m === EARLIEST.m;
  const atEnd = !before(view, monthOf(today));

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Pick a date</Text>
        <View style={styles.quick}>
          <QuickChip label="Today" on={selected === today} onPress={() => jump(today)} />
          <QuickChip label="Yesterday" on={selected === yesterday} onPress={() => jump(yesterday)} />
        </View>
      </View>

      <View style={styles.monthRow}>
        <Pressable onPress={() => step(-1)} disabled={atStart} accessibilityLabel="Previous month" style={[styles.nav, atStart && styles.navOff]}>
          <Icon name="chevronLeft" size={18} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.monthTitle} aria-live="polite">
          {monthName(firstIso)} {view.y}
        </Text>
        <Pressable onPress={() => step(1)} disabled={atEnd} accessibilityLabel="Next month" style={[styles.nav, atEnd && styles.navOff]}>
          <Icon name="chevronRight" size={18} color={colors.text} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEK.map((d) => (
          <Text key={d} style={styles.weekday}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid} role="group" aria-label={`${monthName(firstIso)} ${view.y}`}>
        {cells.map((iso, i) => {
          if (!iso) return <View key={`b${i}`} style={styles.cell} />;
          const future = iso > today;
          const on = iso === selected;
          return (
            <Pressable
              key={iso}
              disabled={future}
              onPress={() => setSelected(iso)}
              accessibilityLabel={`${weekday(iso)} ${dayOfMonth(iso)} ${monthName(iso)} ${view.y}${future ? ', not yet' : ''}`}
              aria-pressed={on}
              style={styles.cell}>
              {({ pressed }) => (
                <View style={[styles.day, iso === today && !on && styles.dayToday, pressed && { transform: [{ scale: 0.9 }] }]}>
                  {on && <LinearGradient colors={gradients.primary} style={[StyleSheet.absoluteFill, styles.dayOn]} />}
                  <Text style={[styles.dayLabel, on && styles.dayLabelOn, future && { color: '#3A3A42' }]}>{dayOfMonth(iso)}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton label={`Use ${pickLabel(selected, today)}`} onPress={() => onPick(selected)} style={{ marginTop: 16 }} />
    </Sheet>
  );
}

function QuickChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} aria-pressed={on} style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && { transform: [{ scale: 0.96 }] }]}>
      <Text style={[styles.chipLabel, on && { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  title: { fontFamily: fonts.expandedSemibold, fontSize: 20, color: colors.text },
  quick: { flexDirection: 'row', gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.surface3,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipOn: { backgroundColor: colors.irisTint, borderColor: colors.iris },
  chipLabel: { fontFamily: fonts.medium, fontSize: 13, color: '#D9D9DE' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  nav: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  navOff: { opacity: 0.3 },
  monthTitle: { fontFamily: fonts.expandedSemibold, fontSize: 17, color: colors.text },
  weekRow: { flexDirection: 'row', height: 28, alignItems: 'center', marginTop: 8 },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 2 },
  cell: { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
  day: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dayToday: { borderWidth: 1.5, borderColor: '#4A4A54' },
  dayOn: { borderRadius: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  dayLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, ...tabular },
  dayLabelOn: { fontFamily: fonts.semibold, color: colors.textOnAccent },
});
