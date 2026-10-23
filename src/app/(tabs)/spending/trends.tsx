import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Amount } from '@/components/amount';
import { BalanceChart } from '@/components/spending/balance-chart';
import { SpendingHeader } from '@/components/spending/spending-header';
import { currentDay, useEntries } from '@/store/entries';
import { useSettings } from '@/store/settings';
import { BUDGET_DAYS, inMonth, monthSummary, runningBalance, suggestedBudget } from '@/store/summary';
import { dayOfMonth, formatMoney, monthName } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, radius, space, tabular, type } from '@/ui/theme';

const SAVING_GOAL = 20; // percent of income

export default function TrendsScreen() {
  const entries = useEntries((s) => s.entries);
  const budget = useSettings((s) => s.monthlyBudget);
  const setBudget = useSettings((s) => s.setMonthlyBudget);
  const { width } = useWindowDimensions();
  const today = currentDay();
  const days = dayOfMonth(today);

  const summary = useMemo(() => monthSummary(entries, today), [entries, today]);
  const balance = useMemo(() => runningBalance(entries, today), [entries, today]);
  const count = useMemo(() => inMonth(entries, today).length, [entries, today]);
  const [selected, setSelected] = useState(days - 1);

  const suggestion = suggestedBudget(summary.spent, days);
  const keepsGoal = summary.income > 0 && ((summary.income - suggestion) / summary.income) * 100 >= SAVING_GOAL;
  const rate = Math.max(0, Math.min(100, summary.savingsRate));

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <SpendingHeader view="trends" month={monthName(today)} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.muted}>You kept</Text>
          <View style={styles.rateRow}>
            <Text style={styles.big}>{summary.savingsRate.toFixed(1)}%</Text>
            <Text style={styles.muted}>of your income</Text>
          </View>
          <View
            style={styles.track}
            role="img"
            aria-label={`${summary.savingsRate.toFixed(1)} percent kept against a ${SAVING_GOAL} percent goal`}>
            <LinearGradient colors={['#5240D9', colors.lilac]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${rate}%` }]} />
            <View style={[styles.goal, { left: `${SAVING_GOAL}%` }]} />
          </View>
          <View style={styles.goalLabelRow}>
            <Text style={[styles.goalLabel, { left: `${SAVING_GOAL}%` }]}>{SAVING_GOAL}% goal</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Running balance</Text>
            <Text style={styles.sectionHint}>Tap any day to inspect it</Text>
          </View>
          <BalanceChart days={balance} month={today} width={width - space.screenX * 2} selected={selected} onSelect={setSelected} />
        </View>

        <View style={styles.stats}>
          <Stat label="Spent a day" value={formatMoney(Math.round(summary.spent / days))} />
          <Stat label="Earned a day" value={formatMoney(Math.round(summary.income / days))} color={colors.mint} divider />
          <Stat label="Entries" value={String(count)} divider plain />
        </View>

        <View style={styles.card}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <RadialGradient id="glow" cx="100%" cy="0%" rx="120%" ry="140%" fx="100%" fy="0%">
                <Stop offset="0" stopColor={colors.iris} stopOpacity={0.22} />
                <Stop offset="0.6" stopColor={colors.iris} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#glow)" />
          </Svg>
          <View style={{ gap: 4 }}>
            <Text style={styles.cardTitle}>
              Try a <Text style={tabular}>{formatMoney(suggestion)}</Text> monthly budget
            </Text>
            <Text style={styles.cardBody}>
              {budget !== null
                ? "Done. Finey will tell you when you've used 80% of it."
                : `That covers ${BUDGET_DAYS} days at your current daily spend, ${keepsGoal ? 'and keeps your saving rate above goal.' : 'though your saving rate would drop below goal.'}`}
            </Text>
          </View>
          {budget === null ? (
            <Pressable onPress={() => setBudget(suggestion)} style={({ pressed }) => [styles.setButton, pressed && { transform: [{ scale: 0.97 }] }]}>
              <Text style={styles.setLabel}>Set this budget</Text>
            </Pressable>
          ) : (
            <View style={styles.setDone} role="status">
              <Icon name="check" size={18} color={colors.mint} strokeWidth={2.2} />
              <Text style={styles.setDoneLabel}>Budget set</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color, divider, plain }: { label: string; value: string; color?: string; divider?: boolean; plain?: boolean }) {
  const style = [styles.statValue, color ? { color } : null];
  return (
    <View style={[styles.stat, divider && styles.statDivider]}>
      <Text style={styles.statLabel}>{label}</Text>
      {plain ? <Text style={style}>{value}</Text> : <Amount style={style}>{value}</Amount>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 32 },
  hero: { paddingTop: 20, paddingHorizontal: space.screenX },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  rateRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 2 },
  big: { ...type.display, ...tabular, letterSpacing: -0.66, lineHeight: 50, color: colors.text },
  track: { height: 6, marginTop: 14, borderRadius: 3, backgroundColor: colors.surface3 },
  fill: { height: 6, borderRadius: 3 },
  goal: { position: 'absolute', top: -4, width: 2, height: 14, borderRadius: 1, backgroundColor: colors.text },
  goalLabelRow: { height: 20, marginTop: 6 },
  goalLabel: { position: 'absolute', marginLeft: -26, fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  section: { paddingTop: 22, paddingHorizontal: space.screenX },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { ...type.section, color: colors.text },
  sectionHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  stats: { flexDirection: 'row', marginTop: 22, marginHorizontal: space.screenX },
  stat: { flex: 1, gap: 4 },
  statDivider: { paddingLeft: 14, borderLeftWidth: 1, borderLeftColor: colors.line },
  statLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  statValue: { fontFamily: fonts.expandedSemibold, fontSize: 16, color: colors.text, ...tabular },
  card: {
    marginTop: 22,
    marginHorizontal: space.screenX,
    padding: 18,
    borderRadius: radius.cardLarge,
    backgroundColor: colors.surface1,
    overflow: 'hidden',
    gap: 14,
  },
  cardTitle: { fontFamily: fonts.expandedSemibold, fontSize: 16, color: colors.text },
  cardBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  setButton: { alignSelf: 'flex-start', height: 44, paddingHorizontal: 20, borderRadius: 22, backgroundColor: colors.text, justifyContent: 'center' },
  setLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.bg },
  setDone: {
    alignSelf: 'flex-start',
    height: 44,
    paddingLeft: 14,
    paddingRight: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(94,224,161,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setDoneLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.mint },
});
