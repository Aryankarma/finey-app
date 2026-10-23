import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Amount } from '@/components/amount';
import { EntryRow } from '@/components/ledger/entry-row';
import { EntrySheet } from '@/components/ledger/entry-sheet';
import { FiltersSheet } from '@/components/ledger/filters-sheet';
import { LedgerHeader } from '@/components/ledger/ledger-header';
import type { Entry } from '@/data/seed';
import { deleteEntryWithUndo } from '@/store/actions';
import { currentDay, useEntries } from '@/store/entries';
import { countLabel, defaultFilters, ledgerEntries, signedAmount, sortLabels, useLedger } from '@/store/ledger';
import { categories } from '@/ui/categories';
import { dayOfMonth, formatMoney, monthName, shortDay } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, space, tabular } from '@/ui/theme';

type Item = { kind: 'day'; date: string; total: number; first: boolean } | { kind: 'entry'; entry: Entry };

const signed = (n: number) => (n === 0 ? '₹0' : formatMoney(n, { signed: true }));

export default function LedgerScreen() {
  const router = useRouter();
  const entries = useEntries((s) => s.entries);
  const ledger = useLedger();
  const today = currentDay();
  const [selected, setSelected] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [swiped, setSwiped] = useState<string | null>(null);

  const filters = { show: ledger.show, savedOnly: ledger.savedOnly, sort: ledger.sort };
  const list = useMemo(
    () => ledgerEntries(entries, today, { show: ledger.show, savedOnly: ledger.savedOnly, sort: ledger.sort }, ledger.query),
    [entries, today, ledger.show, ledger.savedOnly, ledger.sort, ledger.query],
  );
  const total = list.reduce((sum, e) => sum + signedAmount(e), 0);
  const byDay = ledger.sort === 'newest' || ledger.sort === 'oldest';

  const items = useMemo(() => {
    if (!byDay) return list.map((entry): Item => ({ kind: 'entry', entry }));
    const dayTotals = new Map<string, number>();
    for (const e of list) dayTotals.set(e.date, (dayTotals.get(e.date) ?? 0) + signedAmount(e));
    const out: Item[] = [];
    let lastDate = '';
    for (const entry of list) {
      if (entry.date !== lastDate) {
        out.push({ kind: 'day', date: entry.date, total: dayTotals.get(entry.date) ?? 0, first: out.length === 0 });
        lastDate = entry.date;
      }
      out.push({ kind: 'entry', entry });
    }
    return out;
  }, [list, byDay]);

  const remove = useCallback((id: string) => {
    setSwiped(null);
    deleteEntryWithUndo(id);
  }, []);

  const filtered = ledger.show !== 'all' || ledger.savedOnly || ledger.query.trim() !== '';

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <LedgerHeader view="list" action={{ icon: 'upload', label: 'Export this month as a spreadsheet' }} />

      <View style={styles.top}>
        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.textFaint} />
          <TextInput
            value={ledger.query}
            onChangeText={ledger.setQuery}
            placeholder="Search names or categories"
            placeholderTextColor={colors.textFaint}
            accessibilityLabel="Search the ledger"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {ledger.query.length > 0 && (
            <Pressable onPress={() => ledger.setQuery('')} accessibilityLabel="Clear search" hitSlop={8}>
              <Icon name="clear" size={18} color={colors.textFaint} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroller} contentContainerStyle={styles.chips}>
          <Chip label={monthName(today)} trailing="chevronDown" />
          <Chip
            label={ledger.show === 'expense' ? 'Expenses only' : ledger.show === 'income' ? 'Income only' : 'All entries'}
            on={ledger.show !== 'all'}
            onPress={() => setFiltersOpen(true)}
            onClear={ledger.show !== 'all' ? () => ledger.setFilters({ ...filters, show: 'all' }) : undefined}
          />
          <Chip label="Saved" leading="bookmark" on={ledger.savedOnly} onPress={() => setFiltersOpen(true)} />
          <Chip label={sortLabels[ledger.sort]} onPress={() => setFiltersOpen(true)} />
        </ScrollView>

        <View style={styles.summary}>
          <Text style={styles.count}>{countLabel(list.length, filters)}</Text>
          <Amount style={[styles.total, total > 0 && { color: colors.mint }]}>{signed(total)}</Amount>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => (item.kind === 'day' ? `d-${item.date}` : item.entry.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setSwiped(null)}
        renderItem={({ item }) =>
          item.kind === 'day' ? (
            <View style={[styles.dayHead, !item.first && { marginTop: 16 }]}>
              <View style={styles.dayTitle}>
                <Text style={styles.dayStrong}>{item.date === today ? 'Today' : shortDay(item.date)}</Text>
                {item.date === today && <Text style={styles.dayFaint}>{shortDay(item.date)}</Text>}
              </View>
              <Amount style={styles.dayFaint}>{signed(item.total)}</Amount>
            </View>
          ) : (
            <EntryRow
              entry={item.entry}
              subtitle={byDay ? undefined : `${categories[item.entry.category].label}, ${dayOfMonth(item.entry.date)} ${monthName(item.entry.date, 'short')}`}
              onPress={() => setSelected(item.entry.id)}
              onDelete={() => remove(item.entry.id)}
              swipeOpen={swiped === item.entry.id}
              onSwipeChange={(open) => setSwiped(open ? item.entry.id : null)}
            />
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name={ledger.savedOnly ? 'bookmark' : 'search'} size={24} color={colors.textFaint} />
            </View>
            <Text style={styles.emptyTitle}>
              {ledger.query.trim() ? `Nothing matches “${ledger.query.trim()}”` : `${countLabel(0, filters)} yet`}
            </Text>
            <Text style={styles.emptyBody}>
              {ledger.savedOnly
                ? `Save ${ledger.show === 'income' ? 'an income entry' : 'an entry'} from its details and it will show up here.`
                : 'Try another search, or clear the filters to see everything.'}
            </Text>
            {filtered && (
              <Pressable
                onPress={() => {
                  ledger.setFilters(defaultFilters);
                  ledger.setQuery('');
                }}
                style={styles.emptyButton}>
                <Text style={styles.emptyButtonLabel}>Clear filters</Text>
              </Pressable>
            )}
          </View>
        }
      />

      <EntrySheet
        entryId={selected}
        onClose={() => setSelected(null)}
        onEdit={(id) => {
          setSelected(null);
          router.push({ pathname: '/entry/[id]/edit', params: { id } });
        }}
      />
      <FiltersSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </SafeAreaView>
  );
}

function Chip({
  label,
  on = false,
  leading,
  trailing,
  onPress,
  onClear,
}: {
  label: string;
  on?: boolean;
  leading?: 'bookmark';
  trailing?: 'chevronDown';
  onPress?: () => void;
  onClear?: () => void;
}) {
  const color = on ? '#DCD7FF' : '#D9D9DE';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && { transform: [{ scale: 0.96 }] }]}>
      {leading && <Icon name={leading} size={13} color={color} strokeWidth={2} fill={on ? color : 'none'} />}
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
      {trailing && <Icon name={trailing} size={14} color={color} strokeWidth={2} />}
      {onClear && (
        <Pressable onPress={onClear} hitSlop={10} accessibilityLabel={`Clear ${label}`}>
          <Icon name="close" size={13} color={color} strokeWidth={2.2} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { paddingTop: 12, paddingHorizontal: space.screenX },
  search: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    ...Platform.select<object>({ web: { outlineStyle: 'none' }, default: {} }),
  },
  chipScroller: { flexGrow: 0, marginTop: 12, marginHorizontal: -space.screenX },
  chips: { gap: 8, paddingHorizontal: space.screenX },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipOn: { backgroundColor: colors.irisTint },
  chipLabel: { fontFamily: fonts.medium, fontSize: 13 },
  summary: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 16 },
  count: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  total: { fontFamily: fonts.expandedSemibold, fontSize: 17, color: colors.text },
  list: { paddingTop: 12, paddingHorizontal: space.screenX, paddingBottom: 96 },
  dayHead: { height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayTitle: { flexDirection: 'row', gap: 8 },
  dayStrong: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  dayFaint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint, ...tabular },
  empty: { paddingTop: 56, paddingHorizontal: 12, alignItems: 'center', gap: 10 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 6, fontFamily: fonts.expandedSemibold, fontSize: 17, color: colors.text, textAlign: 'center' },
  emptyBody: { maxWidth: 280, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center' },
  emptyButton: { marginTop: 6, height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: colors.surface2, justifyContent: 'center' },
  emptyButtonLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
});
