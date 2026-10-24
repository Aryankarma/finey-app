import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/sheet';
import { Pop, SlideIn } from '@/components/slide-in';
import { useAccent } from '@/hooks/use-accent';
import { currentDay, useEntries } from '@/store/entries';
import { useViewDay, useViewMonth } from '@/store/view-month';
import { monthName } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, tabular } from '@/ui/theme';

// "Choose a month": year stepper and month grid. Picking closes the sheet and changes the shared month.
export function MonthPickerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const setMonth = useViewMonth((s) => s.setMonth);
  const viewDay = useViewDay();
  const today = currentDay();
  const nowYear = Number(today.slice(0, 4));
  const nowMonth = Number(today.slice(5, 7));
  // You can go back as far as the year of your oldest entry.
  const oldest = useEntries((s) => s.entries.at(-1)?.date);
  const firstYear = Math.min(nowYear, Number((oldest ?? today).slice(0, 4)));
  const selected = viewDay.slice(0, 7);
  const [year, setYear] = useState(Number(selected.slice(0, 4)));
  const [picked, setPicked] = useState(selected);
  const [dir, setDir] = useState(0); // -1 stepped back a year, 1 forward, 0 just opened
  const accent = useAccent();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const step = (by: number, to = year + by) => {
    setDir(Math.sign(by));
    setYear(to);
  };

  useEffect(() => {
    if (visible) {
      setYear(Number(selected.slice(0, 4)));
      setPicked(selected);
      setDir(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Show the pick for a moment, then close and apply it.
  const choose = (month: string) => {
    setPicked(month);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setMonth(month);
      onClose();
    }, 220);
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} role="heading">Choose a month</Text>
          <Pressable
            onPress={() => {
              if (year !== nowYear) step(Math.sign(nowYear - year), nowYear);
              choose(today.slice(0, 7));
            }}
            style={({ pressed }) => [styles.thisMonth, pressed && { transform: [{ scale: 0.96 }] }]}>
            <Text style={[styles.thisMonthLabel, { color: accent.lilacSoft }]}>This month</Text>
          </Pressable>
        </View>

        <View style={styles.yearRow}>
          <Pressable onPress={() => step(-1)} disabled={year <= firstYear} accessibilityLabel="Previous year" style={[styles.nav, year <= firstYear && { opacity: 0.3 }]}>
            <Icon name="chevronLeft" size={18} color={colors.text} strokeWidth={2} />
          </Pressable>
          <Text style={styles.year} aria-live="polite">{year}</Text>
          <Pressable onPress={() => step(1)} disabled={year >= nowYear} accessibilityLabel="Next year" style={[styles.nav, year >= nowYear && { opacity: 0.3 }]}>
            <Icon name="chevronRight" size={18} color={colors.text} strokeWidth={2} />
          </Pressable>
        </View>

        {/* The grid slides in from the side you stepped towards. */}
        <SlideIn key={year} x={28 * dir} duration={300} style={styles.grid}>
          <View style={styles.gridInner} role="radiogroup" aria-label={`Months in ${year}`}>
            {Array.from({ length: 12 }, (_, i) => {
              const month = `${year}-${String(i + 1).padStart(2, '0')}`;
              const future = year > nowYear || (year === nowYear && i + 1 > nowMonth);
              const on = month === picked;
              const isNow = year === nowYear && i + 1 === nowMonth;
              return (
                <Pop key={month} active={on} style={styles.cellSlot}>
                  <Pressable
                    role="radio"
                    aria-checked={on}
                    accessibilityLabel={`${monthName(`${month}-01`)} ${year}`}
                    disabled={future}
                    onPress={() => choose(month)}
                    style={({ pressed }) => [
                      styles.cell,
                      isNow && !on && styles.cellNow,
                      future && styles.cellFuture,
                      pressed && { transform: [{ scale: 0.95 }] },
                    ]}>
                    {on && <LinearGradient colors={accent.primary} style={[StyleSheet.absoluteFill, styles.cellOn]} />}
                    <Text style={[styles.cellLabel, on && styles.cellLabelOn, future && { color: '#4A4A54' }]}>{monthName(`${month}-01`, 'short')}</Text>
                  </Pressable>
                </Pop>
              );
            })}
          </View>
        </SlideIn>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 4, paddingBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.expandedSemibold, fontSize: 20, color: colors.text },
  thisMonth: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surface3, justifyContent: 'center' },
  thisMonthLabel: { fontFamily: fonts.semibold, fontSize: 13 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  nav: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  year: { fontFamily: fonts.expandedSemibold, fontSize: 20, color: colors.text, ...tabular },
  grid: { marginTop: 16, marginHorizontal: -5 },
  gridInner: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  cellSlot: { width: '33.333%', paddingHorizontal: 5 },
  cell: { height: 54, borderRadius: 27, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cellNow: { borderWidth: 1.5, borderColor: '#4A4A54' },
  cellFuture: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  cellOn: { borderRadius: 27, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  cellLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  cellLabelOn: { fontFamily: fonts.semibold, color: colors.textOnAccent },
});
