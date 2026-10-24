import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/sheet';
import { currentDay } from '@/store/entries';
import { useViewDay, useViewMonth } from '@/store/view-month';
import { monthName } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, gradients, tabular } from '@/ui/theme';

const FIRST_YEAR = 2025; // the boards stop at January 2025
const listNames = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);

// "Choose a month": year stepper and month grid. Picking closes the sheet and changes the shared month.
export function MonthPickerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const setMonth = useViewMonth((s) => s.setMonth);
  const viewDay = useViewDay();
  const today = currentDay();
  const nowYear = Number(today.slice(0, 4));
  const nowMonth = Number(today.slice(5, 7));
  const selected = viewDay.slice(0, 7);
  const [year, setYear] = useState(Number(selected.slice(0, 4)));
  const [picked, setPicked] = useState(selected);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      setYear(Number(selected.slice(0, 4)));
      setPicked(selected);
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

  const later =
    year === nowYear
      ? Array.from({ length: 12 - nowMonth }, (_, i) => monthName(`${year}-${String(nowMonth + 1 + i).padStart(2, '0')}-01`))
      : [];

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} role="heading">Choose a month</Text>
          <Pressable
            onPress={() => {
              setYear(nowYear);
              choose(today.slice(0, 7));
            }}
            style={({ pressed }) => [styles.thisMonth, pressed && { transform: [{ scale: 0.96 }] }]}>
            <Text style={styles.thisMonthLabel}>This month</Text>
          </Pressable>
        </View>

        <View style={styles.yearRow}>
          <Pressable onPress={() => setYear(year - 1)} disabled={year <= FIRST_YEAR} accessibilityLabel="Previous year" style={[styles.nav, year <= FIRST_YEAR && { opacity: 0.3 }]}>
            <Icon name="chevronLeft" size={18} color={colors.text} strokeWidth={2} />
          </Pressable>
          <Text style={styles.year} aria-live="polite">{year}</Text>
          <Pressable onPress={() => setYear(year + 1)} disabled={year >= nowYear} accessibilityLabel="Next year" style={[styles.nav, year >= nowYear && { opacity: 0.3 }]}>
            <Icon name="chevronRight" size={18} color={colors.text} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.grid} role="radiogroup" aria-label={`Months in ${year}`}>
          {Array.from({ length: 12 }, (_, i) => {
            const month = `${year}-${String(i + 1).padStart(2, '0')}`;
            const future = year > nowYear || (year === nowYear && i + 1 > nowMonth);
            const on = month === picked;
            const isNow = year === nowYear && i + 1 === nowMonth;
            return (
              <View key={month} style={styles.cellSlot}>
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
                  {on && <LinearGradient colors={gradients.primary} style={[StyleSheet.absoluteFill, styles.cellOn]} />}
                  <Text style={[styles.cellLabel, on && styles.cellLabelOn, future && { color: '#4A4A54' }]}>{monthName(`${month}-01`, 'short')}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {later.length > 0 && (
          <Text style={styles.later}>
            {listNames(later)} {later.length === 1 ? 'opens once it begins.' : 'open once they begin.'}
          </Text>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 4, paddingBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.expandedSemibold, fontSize: 20, color: colors.text },
  thisMonth: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surface3, justifyContent: 'center' },
  thisMonthLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.lilacSoft },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  nav: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  year: { fontFamily: fonts.expandedSemibold, fontSize: 20, color: colors.text, ...tabular },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, marginHorizontal: -5, rowGap: 10 },
  cellSlot: { width: '33.333%', paddingHorizontal: 5 },
  cell: { height: 54, borderRadius: 27, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cellNow: { borderWidth: 1.5, borderColor: '#4A4A54' },
  cellFuture: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  cellOn: { borderRadius: 27, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  cellLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  cellLabelOn: { fontFamily: fonts.semibold, color: colors.textOnAccent },
  later: { marginTop: 16, textAlign: 'center', fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
});
