import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Amount } from '@/components/amount';
import { QuickAdd } from '@/components/home/quick-add';
import { RecentRow } from '@/components/home/recent-row';
import { SpendRing } from '@/components/home/spend-ring';
import { useEntrance } from '@/hooks/use-entrance';
import { dailySpend, entries, monthSummary, today } from '@/data/seed';
import { usePrivacy } from '@/state/privacy';
import { dayOfMonth, daysInMonth, formatMoney, monthName } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, layout, motion, space, tabular } from '@/ui/theme';

const RING_MAX = 320;
const incomeDays = entries.filter((e) => e.type === 'income').map((e) => dayOfMonth(e.date));
const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

export default function HomeScreen() {
  const router = useRouter();
  const { hidden, toggle } = usePrivacy();
  const { width } = useWindowDimensions();
  const elapsed = useEntrance(1600);
  const month = monthName(today);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.month} accessibilityRole="button" accessibilityLabel={`Change month, ${month} ${today.slice(0, 4)}`}>
            <Text style={styles.monthName}>{month}</Text>
            <Text style={styles.year}>{today.slice(0, 4)}</Text>
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
              <Icon name={hidden ? 'eyeOff' : 'eye'} color={hidden ? colors.lilac : colors.text} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Settings" style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Icon name="sliders" color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.ring}>
          <SpendRing
            size={Math.min(RING_MAX, width - space.screenX * 2)}
            elapsed={elapsed}
            dailySpend={dailySpend}
            daysInMonth={daysInMonth(today)}
            incomeDays={incomeDays}
            balance={monthSummary.net}
            savingsRate={monthSummary.savingsRate}
            monthLabel={month}
          />
        </View>
        <Text style={styles.legend}>Each mark is a day of spending. Green dots are days money came in.</Text>

        <View style={styles.totals}>
          <View style={styles.total}>
            <Text style={styles.totalLabel}>Money in</Text>
            <Amount style={[styles.totalValue, { color: colors.mint }]}>{formatMoney(monthSummary.income, { signed: true })}</Amount>
          </View>
          <View style={[styles.total, styles.totalDivider]}>
            <Text style={styles.totalLabel}>Money out</Text>
            <Amount style={styles.totalValue}>{formatMoney(-monthSummary.spent)}</Amount>
          </View>
        </View>

        <QuickAdd />

        <View style={styles.recent}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent</Text>
            <Pressable onPress={() => router.navigate('/ledger')} accessibilityRole="link" hitSlop={8}>
              <Text style={styles.link}>Open ledger</Text>
            </Pressable>
          </View>
          {recent.map((entry) => (
            <RecentRow key={entry.id} entry={entry} today={today} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  link: { fontFamily: fonts.medium, fontSize: 14, color: colors.lilac },
});
