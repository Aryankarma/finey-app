import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Amount } from '@/components/amount';
import { EntryRow } from '@/components/ledger/entry-row';
import { EntrySheet } from '@/components/ledger/entry-sheet';
import { LedgerHeader } from '@/components/ledger/ledger-header';
import { MonthPickerSheet } from '@/components/month-picker-sheet';
import { Screen } from '@/components/screen';
import { SlideIn } from '@/components/slide-in';
import { useAccent } from '@/hooks/use-accent';
import { currentDay, useEntries } from '@/store/entries';
import { inMonth, monthSummary } from '@/store/summary';
import { useViewDay } from '@/store/view-month';
import { addDays, dayOfMonth, daysInMonth, formatMoney, monthName, toIso, weekday } from '@/ui/format';
import { colors, fonts, space, tabular } from '@/ui/theme';

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Day shading by spend, matching the legend.
const HEAT = [0.1, 0.2, 0.34, 0.55]; // accent alpha
const heat = (spent: number) => (spent < 1000 ? 0 : spent < 3000 ? 1 : spent < 6000 ? 2 : 3);
const compact = (v: number) => (v < 1000 ? String(v) : `${(v / 1000).toFixed(1)}k`);

export default function LedgerCalendarScreen() {
  const router = useRouter();
  const entries = useEntries((s) => s.entries);
  const today = currentDay(); // real today: outlined, and days after it are dimmed
  const viewDay = useViewDay(); // last day of the month being shown
  const [picked, setPicked] = useState(viewDay);
  const [openEntry, setOpenEntry] = useState<string | null>(null);
  const [monthOpen, setMonthOpen] = useState(false);
  const accent = useAccent();
  // A pick from another month falls back to the shown month's last day.
  const selectedDay = picked.slice(0, 7) === viewDay.slice(0, 7) ? picked : viewDay;
  const [picks, setPicks] = useState(0); // the details only animate once you pick a day
  const setSelectedDay = (iso: string) => {
    setPicked(iso);
    setPicks((n) => n + 1);
  };

  const month = useMemo(() => inMonth(entries, viewDay), [entries, viewDay]);
  const summary = useMemo(() => monthSummary(entries, viewDay), [entries, viewDay]);
  const days = useMemo(() => {
    const byDay = new Map<string, { spent: number; income: number }>();
    for (const e of month) {
      const d = byDay.get(e.date) ?? { spent: 0, income: 0 };
      if (e.type === 'income') d.income += e.amount;
      else d.spent += e.amount;
      byDay.set(e.date, d);
    }
    return byDay;
  }, [month]);

  const y = Number(viewDay.slice(0, 4));
  const m = Number(viewDay.slice(5, 7));
  const first = toIso(y, m, 1);
  const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const cells = [
    ...Array.from({ length: lead }, (_, i) => ({ iso: addDays(first, i - lead), outside: true })),
    ...Array.from({ length: daysInMonth(first) }, (_, i) => ({ iso: toIso(y, m, i + 1), outside: false })),
  ];

  const dayEntries = month.filter((e) => e.date === selectedDay);
  const sel = days.get(selectedDay) ?? { spent: 0, income: 0 };
  const net = sel.income - sel.spent;

  return (
    <Screen style={styles.screen}>
      <LedgerHeader view="calendar" action={{ icon: 'calendar', label: `Change month, ${monthName(viewDay)} ${y}`, onPress: () => setMonthOpen(true) }} />
      <MonthPickerSheet visible={monthOpen} onClose={() => setMonthOpen(false)} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.totals}>
          <Total label="Money in" value={formatMoney(summary.income)} color={colors.mint} />
          <Total label="Money out" value={formatMoney(summary.spent)} divider />
          <Total label="Net" value={formatMoney(summary.net, { signed: true })} divider />
        </View>

        <View style={styles.calendar}>
          <View style={styles.weekRow}>
            {WEEK.map((d) => (
              <Text key={d} style={styles.weekday}>{d}</Text>
            ))}
          </View>
          <View style={styles.grid} role="grid" aria-label={`${monthName(viewDay)} ${y}, days shaded by how much you spent`}>
            {cells.map(({ iso, outside }) => {
              const future = iso > today;
              const info = days.get(iso);
              const spent = info?.spent ?? 0;
              const on = iso === selectedDay;
              const disabled = outside || future;
              return (
                <View key={iso} style={styles.cellSlot}>
                  <Pressable
                    disabled={disabled}
                    onPress={() => setSelectedDay(iso)}
                    aria-pressed={on}
                    accessibilityLabel={`${weekday(iso)} ${dayOfMonth(iso)} ${monthName(iso)}${disabled ? '' : `, ${formatMoney(spent)} spent`}`}
                    style={({ pressed }) => [
                      styles.cell,
                      !disabled && !on && { backgroundColor: `rgba(${accent.rgb},${HEAT[heat(spent)]})` },
                      iso === today && !on && [styles.today, { borderColor: accent.lilac }],
                      pressed && { transform: [{ scale: 0.92 }] },
                    ]}>
                    {on && <LinearGradient colors={accent.primary} style={[StyleSheet.absoluteFill, styles.selected]} />}
                    {!!info?.income && !outside && <View style={styles.incomeDot} />}
                    <Text style={[styles.cellDay, outside && { color: '#34343C' }, future && !outside && { color: colors.textDisabled }]}>
                      {dayOfMonth(iso)}
                    </Text>
                    {!disabled && (
                      <Amount style={[styles.cellAmount, (heat(spent) === 3 || on) && { color: accent.chipText }]}>{compact(spent)}</Amount>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.incomeDot, styles.legendDot]} />
              <Text style={styles.legendText}>Money came in</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendText}>Less</Text>
              {HEAT.map((alpha) => (
                <View key={alpha} style={[styles.legendSwatch, { backgroundColor: `rgba(${accent.rgb},${alpha})` }]} />
              ))}
              <Text style={styles.legendText}>More spent</Text>
            </View>
          </View>
        </View>

        {/* Rises in each time you pick a day. */}
        <View style={styles.detail} aria-live="polite">
          <SlideIn key={selectedDay} y={picks ? 8 : 0} duration={260}>
            <View style={styles.detailHead}>
              <Text style={styles.detailTitle}>
                {weekday(selectedDay)} {dayOfMonth(selectedDay)} {monthName(selectedDay, 'short')}
              </Text>
              <Amount style={[styles.detailNet, net >= 0 && { color: colors.mint }]}>
                {net === 0 ? '₹0' : formatMoney(net, { signed: true })}
              </Amount>
            </View>
            <Text style={styles.detailSub}>
              {dayEntries.length === 0
                ? 'Nothing recorded on this day.'
                : `${dayEntries.length} ${dayEntries.length === 1 ? 'entry' : 'entries'}, ${sel.income ? `${formatMoney(sel.income)} came in` : 'nothing came in'}`}
            </Text>
            {dayEntries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} onPress={() => setOpenEntry(entry.id)} />
            ))}
          </SlideIn>
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

function Total({ label, value, color, divider }: { label: string; value: string; color?: string; divider?: boolean }) {
  return (
    <View style={[styles.total, divider && styles.totalDivider]}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Amount style={[styles.totalValue, color ? { color } : null]}>{value}</Amount>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 96 },
  totals: { flexDirection: 'row', marginTop: 16, marginHorizontal: space.screenX },
  total: { flex: 1, gap: 3 },
  totalDivider: { paddingLeft: 14, borderLeftWidth: 1, borderLeftColor: colors.line },
  totalLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  totalValue: { fontFamily: fonts.expandedSemibold, fontSize: 15, color: colors.text },
  calendar: { paddingTop: 12, paddingHorizontal: 14 },
  weekRow: { flexDirection: 'row', height: 24, alignItems: 'center' },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 },
  cellSlot: { width: `${100 / 7}%`, paddingHorizontal: 2 },
  cell: { height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 1, overflow: 'hidden' },
  today: { borderWidth: 1.5 },
  selected: { borderRadius: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  cellDay: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, ...tabular },
  cellAmount: { fontFamily: fonts.medium, fontSize: 10, color: '#B4B4BE', ...tabular },
  incomeDot: { position: 'absolute', top: 6, right: 7, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.mint },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { position: 'relative', top: 0, right: 0, width: 6, height: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 4 },
  legendText: { fontFamily: fonts.regular, fontSize: 11, color: colors.textFaint },
  detail: { marginTop: 18, marginHorizontal: space.screenX, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.line },
  detailHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  detailTitle: { fontFamily: fonts.expandedSemibold, fontSize: 17, color: colors.text },
  detailNet: { fontFamily: fonts.expandedSemibold, fontSize: 17, color: colors.text },
  detailSub: { marginTop: 4, marginBottom: 6, fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
});
