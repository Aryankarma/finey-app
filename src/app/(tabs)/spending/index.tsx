import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Amount } from '@/components/amount';
import { SpendingHeader } from '@/components/spending/spending-header';
import { currentDay, useEntries } from '@/store/entries';
import { categorySpend, dailySpend, monthSummary, weekBuckets, type WeekBucket } from '@/store/summary';
import { categories } from '@/ui/categories';
import { dayOfMonth, daysInMonth, formatCompact, formatMoney, monthName } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, space, tabular, type } from '@/ui/theme';

const BAR_HEIGHT = 104;
const VISIBLE_CATEGORIES = 4;

const ordinal = (n: number) => {
  const tail = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${tail}`;
};

const listNames = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);

// The sentence under the week bars for the picked week.
function weekCaption(week: WeekBucket, weeks: WeekBucket[], spend: number[], today: number, mon: string): string {
  const range = `${week.from}–${week.to} ${mon}`;
  if (!week.started) {
    return week.from === today + 1 ? 'Nothing yet. This week starts tomorrow.' : `Nothing yet. This week starts on the ${ordinal(week.from)}.`;
  }
  if (week.current) {
    const days = today - week.from + 1;
    return `${formatMoney(week.total)} so far in ${range}, about ${formatMoney(Math.round(week.total / days))} a day.`;
  }
  const started = weeks.filter((w) => w.started);
  const finished = started.filter((w) => !w.current);
  if (started.length > 1 && week.total === Math.max(...started.map((w) => w.total))) {
    const days = spend.slice(week.from - 1, week.to);
    const top = Math.max(...days);
    return `${formatMoney(week.total)} in ${range}, your biggest week. ${formatMoney(top)} of it went out on the ${ordinal(week.from + days.indexOf(top))}.`;
  }
  if (finished.length > 1 && week.total === Math.min(...finished.map((w) => w.total))) {
    return `${formatMoney(week.total)} in ${range}, your lightest full week so far.`;
  }
  return `${formatMoney(week.total)} in ${range}.`;
}

export default function SpendingScreen() {
  const router = useRouter();
  const entries = useEntries((s) => s.entries);
  const today = currentDay();
  const todayNum = dayOfMonth(today);
  const mon = monthName(today, 'short');

  const summary = useMemo(() => monthSummary(entries, today), [entries, today]);
  const spend = useMemo(() => dailySpend(entries, today), [entries, today]);
  const weeks = useMemo(() => weekBuckets(spend, today, daysInMonth(today)), [spend, today]);
  const byCategory = useMemo(() => categorySpend(entries, today), [entries, today]);

  const [picked, setPicked] = useState(() => Math.max(0, weeks.findIndex((w) => w.current)));
  const [showAll, setShowAll] = useState(false);
  const tallest = Math.max(1, ...weeks.map((w) => w.total));
  const hidden = byCategory.slice(VISIBLE_CATEGORIES);
  const shown = showAll ? byCategory : byCategory.slice(0, VISIBLE_CATEGORIES);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <SpendingHeader view="breakdown" month={monthName(today)} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.muted}>You spent</Text>
          <Amount style={styles.big}>{formatMoney(summary.spent)}</Amount>
          <Text style={[styles.muted, { marginTop: 6 }]}>
            {summary.income > 0 ? (
              <>
                That&apos;s {Math.round((summary.spent / summary.income) * 100)}% of the{' '}
                <Text style={{ color: colors.mint, ...tabular }}>{formatMoney(summary.income)}</Text> that came in.
              </>
            ) : (
              'Nothing has come in yet this month.'
            )}
          </Text>
        </View>

        <View style={styles.section}>
          <SectionHead title="By week" hint="Tap a week" />
          <View style={styles.weeks} role="radiogroup" aria-label="Spending by week">
            {weeks.map((w, i) => {
              const on = i === picked;
              const height = w.started ? Math.max(6, Math.round((w.total / tallest) * BAR_HEIGHT)) : 6;
              return (
                <Pressable
                  key={w.from}
                  role="radio"
                  aria-checked={on}
                  accessibilityLabel={`${w.from} to ${w.to} ${monthName(today)}, ${w.started ? formatMoney(w.total) : 'not started'}`}
                  onPress={() => setPicked(i)}
                  style={({ pressed }) => [styles.week, pressed && { transform: [{ scale: 0.97 }] }]}>
                  <Text style={[styles.weekText, on && styles.weekTextOn]}>{w.started ? formatCompact(w.total) : 'Not yet'}</Text>
                  <View style={styles.barBox}>
                    {w.started ? (
                      <View style={[styles.bar, { height }]}>
                        {on && <LinearGradient colors={[colors.lilac, '#5240D9']} style={StyleSheet.absoluteFill} />}
                      </View>
                    ) : (
                      <View style={[styles.bar, styles.barEmpty, { height }]} />
                    )}
                  </View>
                  <Text style={[styles.weekText, on && styles.weekTextOn]}>
                    {w.from}–{w.to}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.caption} aria-live="polite">{weekCaption(weeks[picked], weeks, spend, todayNum, mon)}</Text>
        </View>

        <View style={[styles.section, { paddingTop: 22 }]}>
          <SectionHead title="By category" hint="Tap one to see its entries" />
          <View style={styles.share} role="img" aria-label="Share of spending by category">
            {byCategory.map((c) => (
              <View key={c.category} style={[styles.shareSlice, { flex: c.total, backgroundColor: c.category === 'other' ? '#4A4A54' : categories[c.category].color }]} />
            ))}
          </View>
          <View style={{ marginTop: 8 }}>
            {shown.map((c) => {
              const cat = categories[c.category];
              return (
                <Pressable
                  key={c.category}
                  onPress={() => router.push({ pathname: '/spending/[category]', params: { category: c.category } })}
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface1 }]}>
                  <View style={styles.glyph}>
                    <Icon name={cat.icon} size={17} color={cat.color} strokeWidth={c.category === 'other' ? 2.4 : 1.75} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.rowName}>{cat.label}</Text>
                    <Text style={styles.rowSub}>{Math.round((c.total / summary.spent) * 100)}% of spending</Text>
                  </View>
                  <Amount style={styles.rowAmount}>{formatMoney(c.total)}</Amount>
                  <Icon name="chevronRight" size={16} color={colors.textDisabled} strokeWidth={2} />
                </Pressable>
              );
            })}
            {hidden.length > 0 && (
              <Pressable onPress={() => setShowAll(!showAll)} aria-expanded={showAll} style={styles.more}>
                <Text style={styles.moreLabel}>
                  {showAll ? 'Show fewer categories' : `Show ${listNames(hidden.map((c) => categories[c.category].label))}`}
                </Text>
                <View style={{ transform: [{ rotate: showAll ? '180deg' : '0deg' }] }}>
                  <Icon name="chevronDown" size={14} color={colors.lilac} strokeWidth={2} />
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHead({ title, hint }: { title: string; hint: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionHint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 32 },
  hero: { paddingTop: 20, paddingHorizontal: space.screenX },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  big: { ...type.display, letterSpacing: -0.66, lineHeight: 50, marginTop: 2, color: colors.text },
  section: { paddingTop: 24, paddingHorizontal: space.screenX },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { ...type.section, color: colors.text },
  sectionHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  weeks: { flexDirection: 'row', gap: 14 },
  week: { flex: 1, gap: 6 },
  weekText: { textAlign: 'center', fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, ...tabular },
  weekTextOn: { fontFamily: fonts.semibold, color: colors.text },
  barBox: { height: BAR_HEIGHT, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 10, backgroundColor: '#2A2640', overflow: 'hidden' },
  barEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2A2A31' },
  caption: { marginTop: 14, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  share: { flexDirection: 'row', gap: 2, height: 10 },
  shareSlice: { borderRadius: 3 },
  row: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 12 },
  glyph: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  rowSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  rowAmount: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  more: { height: 40, flexDirection: 'row', alignItems: 'center', gap: 6 },
  moreLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.lilac },
});
