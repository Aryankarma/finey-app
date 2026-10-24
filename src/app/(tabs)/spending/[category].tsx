import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Amount } from '@/components/amount';
import { EntrySheet } from '@/components/ledger/entry-sheet';
import { MonthChip } from '@/components/month-chip';
import { Screen } from '@/components/screen';
import type { CategoryKey, Entry } from '@/data/seed';
import { easeOutCubic, progress, useEntrance } from '@/hooks/use-entrance';
import { useEntries } from '@/store/entries';
import { inMonth, monthSummary } from '@/store/summary';
import { useIsCurrentMonth, useViewDay } from '@/store/view-month';
import { categories } from '@/ui/categories';
import { addDays, dayOfMonth, daysInMonth, formatMoney, monthName, shortDay, toIso, weekday } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, layout, space, tabular, type } from '@/ui/theme';

const BARS_HEIGHT = 112;
const BAR_MAX = 104;
const FIRST_ROWS = 6;

// One category's month: total, share, day-by-day bars and its entries.
// Opened from Spending; Food & Dining on the boards stands in for any category.
export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/spending'));

  if (!category || !(category in categories)) {
    return (
      <Screen style={styles.screen}>
        <Header title="Spending" onBack={back} />
        <Text style={[styles.muted, { padding: space.screenX }]}>That category doesn&apos;t exist.</Text>
      </Screen>
    );
  }
  return <CategoryView category={category as CategoryKey} onBack={back} />;
}

function CategoryView({ category, onBack }: { category: CategoryKey; onBack: () => void }) {
  const router = useRouter();
  const entries = useEntries((s) => s.entries);
  const today = useViewDay(); // last day shown: today, or the end of a past month
  const isCurrent = useIsCurrentMonth();
  const todayNum = dayOfMonth(today);
  const monthDays = daysInMonth(today);
  const c = categories[category];
  const elapsed = useEntrance(1100);

  const month = useMemo(() => inMonth(entries, today), [entries, today]);
  const list = useMemo(() => month.filter((e) => e.category === category && e.type === 'expense'), [month, category]);
  const spent = useMemo(() => monthSummary(entries, today).spent, [entries, today]);
  const total = list.reduce((s, e) => s + e.amount, 0);
  const share = spent > 0 ? Math.round((total / spent) * 100) : 0;

  const perDay = useMemo(() => {
    const days = new Array<number>(monthDays).fill(0);
    for (const e of list) days[dayOfMonth(e.date) - 1] += e.amount;
    return days;
  }, [list, monthDays]);
  const peak = Math.max(1, ...perDay);
  const biggest = list.reduce<Entry | null>((b, e) => (!b || e.amount > b.amount ? e : b), null);
  const weekStart = addDays(today, -6);
  const lastWeek = list.filter((e) => e.date >= weekStart);

  // Picked bar, remembered per month; a new month starts on its biggest day.
  const [pick, setPick] = useState<{ month: string; day: number } | null>(null);
  const selected = pick?.month === today ? pick.day : perDay.indexOf(Math.max(...perDay)) + 1 || todayNum;
  const setSelected = (day: number) => setPick({ month: today, day });
  const [showAll, setShowAll] = useState(false);
  const [openEntry, setOpenEntry] = useState<string | null>(null);

  const count = easeOutCubic(progress(elapsed, 100, 900));
  const selIso = toIso(Number(today.slice(0, 4)), Number(today.slice(5, 7)), selected);
  const rows = showAll ? list : list.slice(0, FIRST_ROWS);
  const tint = `${c.color}1F`;

  const pickDay = (day: number) => {
    setSelected(day);
    const index = list.findIndex((e) => dayOfMonth(e.date) === day);
    if (index >= FIRST_ROWS) setShowAll(true);
  };

  return (
    <Screen style={styles.screen}>
      <Header title={c.label} onBack={onBack} badge={{ icon: c.icon, color: c.color }} showMonth />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.muted}>You spent</Text>
          <Amount style={styles.big}>{formatMoney(Math.round(total * count))}</Amount>
          <View style={styles.track} role="img" aria-label={`${share} percent of ${monthName(today)}'s spending`}>
            <View style={[styles.fill, { width: `${share * count}%`, backgroundColor: c.color }]} />
          </View>
          <View style={styles.shareRow}>
            <Text style={styles.small}>
              <Text style={styles.strong}>{share}%</Text> of {monthName(today)}&apos;s spending
            </Text>
            <Text style={[styles.small, tabular]}>
              {list.length} {list.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat label="Biggest" value={biggest ? formatMoney(biggest.amount) : '₹0'} sub={biggest?.name ?? 'Nothing yet'} />
          <Stat label="Average" value={formatMoney(list.length ? Math.round(total / list.length) : 0)} sub="per entry" divider />
          <Stat
            label="Last 7 days"
            value={formatMoney(lastWeek.reduce((s, e) => s + e.amount, 0))}
            sub={`${lastWeek.length} ${lastWeek.length === 1 ? 'entry' : 'entries'}`}
            divider
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Day by day</Text>
            <Amount style={styles.readout} aria-live="polite">
              {`${shortDay(selIso)}, ${perDay[selected - 1] ? formatMoney(perDay[selected - 1]) : 'nothing spent'}`}
            </Amount>
          </View>
          <View style={styles.bars} role="group" aria-label={`${c.label} spending for each day of ${monthName(today)}`}>
            {perDay.map((v, i) => {
              const day = i + 1;
              const future = day > todayNum;
              const on = day === selected;
              const height = !future && v ? Math.max(6, Math.round((v / peak) * BAR_MAX * easeOutCubic(progress(elapsed, 140 + day * 16, 600)))) : 3;
              return (
                <Pressable
                  key={day}
                  disabled={future}
                  onPress={() => pickDay(day)}
                  aria-pressed={on}
                  accessibilityLabel={`${weekday(toIso(Number(today.slice(0, 4)), Number(today.slice(5, 7)), day))} ${day}, ${future ? 'still to come' : v ? formatMoney(v) : 'nothing spent'}`}
                  style={styles.barSlot}>
                  <View
                    style={[
                      styles.bar,
                      { height },
                      future ? { backgroundColor: '#18181C' } : v ? { backgroundColor: c.color, opacity: on ? 1 : 0.42 } : { backgroundColor: colors.switchOff },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
          <View style={styles.barLabels}>
            <Text style={styles.barLabel}>1 {monthName(today, 'short')}</Text>
            {isCurrent && (
              <Text style={[styles.barLabel, styles.todayLabel, { left: `${((todayNum - 0.5) / monthDays) * 100}%` }]}>Today</Text>
            )}
            <Text style={[styles.barLabel, { position: 'absolute', right: 0 }]}>{monthDays}</Text>
          </View>
        </View>

        <View style={[styles.section, { paddingTop: 20 }]}>
          <View style={[styles.sectionHead, { height: 32, marginBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Entries</Text>
            <Text style={styles.sectionHint}>Newest first</Text>
          </View>
          {rows.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => setOpenEntry(e.id)}
              style={({ pressed }) => [
                styles.entry,
                dayOfMonth(e.date) === selected && { backgroundColor: tint },
                pressed && { backgroundColor: colors.surface1 },
              ]}>
              <View style={styles.date}>
                <Text style={styles.dateNum}>{dayOfMonth(e.date)}</Text>
                <Text style={styles.dateDay}>{weekday(e.date).slice(0, 3)}</Text>
              </View>
              <View style={styles.entryName}>
                <Text style={styles.name} numberOfLines={1}>{e.name}</Text>
                {e.saved && <Icon name="bookmark" size={12} color={colors.lilac} fill={colors.lilac} strokeWidth={0} />}
              </View>
              <Amount style={styles.name}>{formatMoney(-e.amount)}</Amount>
            </Pressable>
          ))}
          {list.length === 0 && <Text style={[styles.muted, { paddingVertical: 12 }]}>Nothing in {c.label} this month yet.</Text>}
          {list.length > FIRST_ROWS && (
            <Pressable onPress={() => setShowAll(!showAll)} aria-expanded={showAll} style={styles.more}>
              <Text style={styles.moreLabel}>{showAll ? 'Show fewer' : `Show all ${list.length} entries`}</Text>
              <View style={{ transform: [{ rotate: showAll ? '180deg' : '0deg' }] }}>
                <Icon name="chevronDown" size={14} color={colors.lilac} strokeWidth={2} />
              </View>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <EntrySheet
        entryId={openEntry}
        onClose={() => setOpenEntry(null)}
        onEdit={(id) => {
          setOpenEntry(null);
          router.push({ pathname: '/entry/[id]/edit', params: { id } });
        }}
      />
    </Screen>
  );
}

function Header({ title, onBack, badge, showMonth }: { title: string; onBack: () => void; badge?: { icon: (typeof categories)[CategoryKey]['icon']; color: string }; showMonth?: boolean }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={onBack} accessibilityLabel="Back to spending" style={({ pressed }) => [styles.iconButton, pressed && { transform: [{ scale: 0.94 }] }]}>
          <Icon name="back" size={18} color={colors.text} strokeWidth={1.9} />
        </Pressable>
        {badge && (
          <View style={[styles.badge, { backgroundColor: `${badge.color}24` }]}>
            <Icon name={badge.icon} size={16} color={badge.color} strokeWidth={1.9} />
          </View>
        )}
        <Text style={styles.title} numberOfLines={1} role="heading">{title}</Text>
      </View>
      {showMonth && <MonthChip />}
    </View>
  );
}

function Stat({ label, value, sub, divider }: { label: string; value: string; sub: string; divider?: boolean }) {
  return (
    <View style={[styles.stat, divider && styles.statDivider]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Amount style={styles.statValue}>{value}</Amount>
      <Text style={styles.statLabel} numberOfLines={1}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 24 },
  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: space.screenX,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1, minWidth: 0 },
  iconButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.pageTitle, color: colors.text, flexShrink: 1 },
  hero: { paddingTop: 16, paddingHorizontal: space.screenX },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  big: { ...type.display, letterSpacing: -0.66, lineHeight: 50, marginTop: 2, color: colors.text },
  track: { height: 6, marginTop: 14, borderRadius: 3, backgroundColor: colors.surface3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  shareRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  small: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  strong: { fontFamily: fonts.semibold, color: colors.text, ...tabular },
  stats: {
    flexDirection: 'row',
    marginTop: 22,
    marginHorizontal: space.screenX,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surface2,
  },
  stat: { flex: 1, gap: 3, minWidth: 0 },
  statDivider: { paddingLeft: 14, borderLeftWidth: 1, borderLeftColor: colors.line },
  statLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  statValue: { fontFamily: fonts.expandedSemibold, fontSize: 16, color: colors.text },
  section: { paddingTop: 22, paddingHorizontal: space.screenX },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { ...type.section, color: colors.text },
  sectionHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  readout: { fontFamily: fonts.regular, fontSize: 13, color: colors.text },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: BARS_HEIGHT },
  barSlot: { flex: 1, height: '100%', paddingHorizontal: 1.5, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3 },
  barLabels: { height: 18, marginTop: 8 },
  barLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textFaint, ...tabular },
  todayLabel: { position: 'absolute', width: 40, marginLeft: -20, textAlign: 'center', fontFamily: fonts.semibold, color: colors.text },
  entry: { height: 60, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, marginHorizontal: -12, borderRadius: 16 },
  date: { width: 36, alignItems: 'center', gap: 1 },
  dateNum: { fontFamily: fonts.expandedSemibold, fontSize: 16, color: colors.text, ...tabular },
  dateDay: { fontFamily: fonts.regular, fontSize: 11, color: colors.textFaint },
  entryName: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  more: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  moreLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.lilac },
});
