import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Amount } from '@/components/amount';
import { QuickAdd } from '@/components/home/quick-add';
import { RecentRow } from '@/components/home/recent-row';
import { SpendRing } from '@/components/home/spend-ring';
import { MonthPickerSheet } from '@/components/month-picker-sheet';
import { Screen } from '@/components/screen';
import { UnlockSheet } from '@/components/unlock-sheet';
import { useAccent } from '@/hooks/use-accent';
import { useEntrance } from '@/hooks/use-entrance';
import { currentDay, useEntries } from '@/store/entries';
import { usePasteHandoff } from '@/store/paste-handoff';
import { useSettings } from '@/store/settings';
import { dailySpend, inMonth, incomeDays, monthSummary } from '@/store/summary';
import { useIsCurrentMonth, useViewDay } from '@/store/view-month';
import { daysInMonth, formatMoney, monthName } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, layout, motion, space, tabular } from '@/ui/theme';

const RING_MAX = 320;

export default function HomeScreen() {
  const router = useRouter();
  const accent = useAccent();
  const hidden = useSettings((s) => s.hideAmounts);
  const setHidden = useSettings((s) => s.setHideAmounts);
  const [unlockOpen, setUnlockOpen] = useState(false);
  // Hiding is instant; showing them again asks for the PIN.
  const toggle = () => (hidden ? setUnlockOpen(true) : setHidden(true));
  const entries = useEntries((s) => s.entries);
  const { width } = useWindowDimensions();
  const elapsed = useEntrance(1600);
  const today = currentDay();
  const viewDay = useViewDay(); // today, or the last day of a past month picked above
  const isCurrent = useIsCurrentMonth();
  const [monthOpen, setMonthOpen] = useState(false);
  const month = monthName(viewDay);

  const summary = useMemo(() => monthSummary(entries, viewDay), [entries, viewDay]);
  const spend = useMemo(() => dailySpend(entries, viewDay), [entries, viewDay]);
  const income = useMemo(() => incomeDays(entries, viewDay), [entries, viewDay]);
  const recent = useMemo(() => inMonth(entries, viewDay).slice(0, 3), [entries, viewDay]);

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={() => setMonthOpen(true)}
            style={styles.month}
            accessibilityRole="button"
            accessibilityLabel={`Change month, ${month} ${viewDay.slice(0, 4)}`}>
            <Text style={styles.monthName}>{month}</Text>
            <Text style={styles.year}>{viewDay.slice(0, 4)}</Text>
            <View style={styles.chevron}>
              <Icon name="chevronDown" size={16} color={colors.textFaint} strokeWidth={2} />
            </View>
          </Pressable>
          <View style={styles.actions}>
            <Pressable
              onPress={toggle}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show amounts' : 'Hide amounts'}
              aria-pressed={hidden}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Icon name={hidden ? 'eyeOff' : 'eye'} color={hidden ? accent.lilac : colors.text} />
            </Pressable>
            <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel="Settings" style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Icon name="sliders" color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.ring}>
          <SpendRing
            size={Math.min(RING_MAX, width - space.screenX * 2)}
            elapsed={elapsed}
            dailySpend={spend}
            daysInMonth={daysInMonth(viewDay)}
            incomeDays={income}
            balance={summary.net}
            savingsRate={summary.income > 0 ? summary.savingsRate : null}
            monthLabel={month}
            current={isCurrent}
            caption={isCurrent ? 'Left this month' : `Left at the end of ${month}`}
          />
        </View>
        <Text style={styles.legend}>Each mark is a day of spending. Green dots are days money came in.</Text>

        <View style={styles.totals}>
          <View style={styles.total}>
            <Text style={styles.totalLabel}>Money in</Text>
            <Amount style={[styles.totalValue, { color: colors.mint }]}>{formatMoney(summary.income, { signed: true })}</Amount>
          </View>
          <View style={[styles.total, styles.totalDivider]}>
            <Text style={styles.totalLabel}>Money out</Text>
            <Amount style={styles.totalValue}>{formatMoney(-summary.spent)}</Amount>
          </View>
        </View>

        <QuickAdd
          onOpenForm={() => router.push('/entry/new')}
          onVoice={() => router.push('/entry/voice')}
          onSubmit={(text) => {
            usePasteHandoff.getState().give(text);
            router.push('/entry/paste');
          }}
        />

        <View style={styles.recent}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent</Text>
            <Pressable onPress={() => router.navigate('/ledger')} accessibilityRole="link" hitSlop={8}>
              <Text style={[styles.link, { color: accent.lilac }]}>Open ledger</Text>
            </Pressable>
          </View>
          {recent.map((entry) => (
            <RecentRow key={entry.id} entry={entry} today={today} />
          ))}
          {recent.length === 0 && <Text style={styles.nothing}>Nothing recorded in {month} yet.</Text>}
        </View>
      </ScrollView>
      <MonthPickerSheet visible={monthOpen} onClose={() => setMonthOpen(false)} />
      <UnlockSheet visible={unlockOpen} onClose={() => setUnlockOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xxl },
  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
  },
  month: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  monthName: { fontFamily: fonts.expandedSemibold, fontSize: 26, letterSpacing: -0.26, color: colors.text },
  year: { fontFamily: fonts.medium, fontSize: 15, color: colors.textFaint, ...tabular },
  chevron: { alignSelf: 'center' },
  actions: { flexDirection: 'row', gap: space.sm },
  iconButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: motion.pressScale - 0.02 }] },
  ring: { alignItems: 'center', marginTop: 4 },
  legend: { marginTop: 2, paddingHorizontal: space.screenX, textAlign: 'center', fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  totals: {
    flexDirection: 'row',
    marginTop: space.lg,
    marginHorizontal: space.screenX,
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surface2,
  },
  total: { flex: 1, alignItems: 'center', gap: space.xs },
  totalDivider: { borderLeftWidth: 1, borderLeftColor: colors.surface2 },
  totalLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  totalValue: { fontFamily: fonts.expandedSemibold, fontSize: 18, color: colors.text },
  recent: { paddingTop: 22, paddingHorizontal: space.screenX },
  recentHeader: { height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recentTitle: { fontFamily: fonts.expandedSemibold, fontSize: 16, color: colors.text },
  link: { fontFamily: fonts.medium, fontSize: 14 },
  nothing: { paddingVertical: 12, fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
});
