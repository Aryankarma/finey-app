import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryChips } from '@/components/category-chips';
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { Keypad } from '@/components/keypad';
import { PrimaryButton } from '@/components/primary-button';
import { RecordedSheet } from '@/components/recorded-sheet';
import type { Entry } from '@/data/seed';
import { useEntryDraft } from '@/store/entry-draft';
import { currentDay, useEntries } from '@/store/entries';
import { descriptionHistory } from '@/store/summary';
import { categories, expenseCategories, incomeCategories } from '@/ui/categories';
import { formatMoney, groupIndian, longDay, relativeDay } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, layout, radius, space, tabular, type } from '@/ui/theme';

const MAX_DIGITS = 7;
const TAB_WIDTH = 96;
const nativeDriver = Platform.OS !== 'web';

export default function NewEntryScreen() {
  const router = useRouter();
  const draft = useEntryDraft();
  const entries = useEntries((s) => s.entries);
  const addEntry = useEntries((s) => s.addEntry);
  const today = currentDay();
  const [dateOpen, setDateOpen] = useState(false);
  const [recorded, setRecorded] = useState<Entry | null>(null);

  // Start clean every time the screen opens; returning from the description screen keeps the draft.
  useEffect(() => {
    useEntryDraft.getState().reset();
  }, []);

  const history = useMemo(() => descriptionHistory(entries), [entries]);
  const known = history.find((h) => h.name.toLowerCase() === draft.name.trim().toLowerCase());
  const amount = draft.amount === '' ? 0 : parseInt(draft.amount, 10);
  const blocked = amount === 0 || draft.category === null;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const pressKey = (digits: string) => {
    const cur = draft.amount;
    const next = cur === '' || cur === '0' ? digits.replace(/^0+/, '') : cur + digits;
    if (next.length > MAX_DIGITS) return;
    draft.set({ amount: next });
  };

  const switchType = (t: Entry['type']) => {
    if (t !== draft.type) draft.set({ type: t, category: null });
  };

  const record = () => {
    if (blocked || draft.category === null) return;
    const entry = addEntry({
      date: draft.date,
      name: draft.name.trim() || categories[draft.category].label,
      category: draft.category,
      type: draft.type,
      amount,
      source: 'keypad',
    });
    setRecorded(entry);
  };

  // "for today", "for yesterday", "for 14 Oct"
  const when = recorded ? relativeDay(recorded.date, today) : '';
  const recordedMessage = recorded
    ? `${formatMoney(recorded.amount)} added to ${categories[recorded.category].label} for ${/^\d/.test(when) ? when : when.toLowerCase()}.`
    : '';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={close} accessibilityLabel="Close" style={({ pressed }) => [styles.iconButton, pressed && { transform: [{ scale: 0.94 }] }]}>
            <Icon name="close" size={18} color={colors.text} strokeWidth={1.9} />
          </Pressable>
          <Text style={styles.title} role="heading">New entry</Text>
        </View>
        <Text style={styles.link}>Paste text instead</Text>
      </View>

      <TypeTabs value={draft.type} onChange={switchType} />

      <View style={styles.amountArea}>
        <Text style={styles.amountLabel}>Amount</Text>
        <AmountDisplay digits={draft.amount} />
      </View>

      <CategoryChips
        key={draft.type}
        options={draft.type === 'income' ? incomeCategories : expenseCategories}
        value={draft.category}
        onChange={(category) => draft.set({ category })}
      />

      <View style={styles.details}>
        <Pressable
          onPress={() => router.push('/entry/describe')}
          accessibilityLabel={draft.name ? `Description, ${draft.name}. Change it` : 'Add a description'}
          style={({ pressed }) => [styles.detailRow, pressed && styles.detailPressed]}>
          <Icon name="lines" size={18} color={colors.textFaint} />
          <Text style={[styles.detailText, !draft.name && { color: colors.textFaint }]} numberOfLines={1}>
            {draft.name || 'What was it for?'}
          </Text>
          {known && <Text style={styles.detailMeta}>Used {known.uses} {known.uses === 1 ? 'time' : 'times'}</Text>}
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          onPress={() => setDateOpen(true)}
          accessibilityLabel={`Date, ${longDay(draft.date, today)}. Change date`}
          style={({ pressed }) => [styles.detailRow, pressed && styles.detailPressed]}>
          <Icon name="calendar" size={18} color={colors.textFaint} />
          <Text style={styles.detailText}>{longDay(draft.date, today)}</Text>
          <Icon name="chevronRight" size={16} color={colors.textFaint} strokeWidth={2} />
        </Pressable>
      </View>

      <Keypad onKey={pressKey} onBackspace={() => draft.set({ amount: draft.amount.slice(0, -1) })} />

      <View style={styles.footer}>
        {blocked && (
          <Text style={styles.hint} role="status">
            {amount === 0 ? 'Enter an amount to record this.' : 'Pick a category to record this.'}
          </Text>
        )}
        <PrimaryButton label={`Record ${formatMoney(amount)} ${draft.type}`} disabled={blocked} onPress={record} />
      </View>

      <DatePickerSheet
        visible={dateOpen}
        value={draft.date}
        today={today}
        onClose={() => setDateOpen(false)}
        onPick={(date) => {
          draft.set({ date });
          setDateOpen(false);
        }}
      />
      <RecordedSheet
        visible={recorded !== null}
        message={recordedMessage}
        onAgain={() => {
          setRecorded(null);
          draft.reset({ type: draft.type });
        }}
        onDone={() => {
          setRecorded(null);
          close();
        }}
      />
    </SafeAreaView>
  );
}

function TypeTabs({ value, onChange }: { value: Entry['type']; onChange: (t: Entry['type']) => void }) {
  const x = useRef(new Animated.Value(value === 'income' ? TAB_WIDTH : 0)).current;

  useEffect(() => {
    Animated.timing(x, {
      toValue: value === 'income' ? TAB_WIDTH : 0,
      duration: 280,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: nativeDriver,
    }).start();
  }, [value, x]);

  return (
    <View style={styles.tabs} role="tablist" aria-label="Type">
      {(['expense', 'income'] as const).map((t) => (
        <Pressable key={t} onPress={() => onChange(t)} role="tab" aria-selected={value === t} style={styles.tab}>
          <Text style={[styles.tabLabel, value === t && { color: colors.text }]}>{t === 'expense' ? 'Expense' : 'Income'}</Text>
        </Pressable>
      ))}
      <Animated.View style={[styles.indicator, { transform: [{ translateX: x }] }]} />
    </View>
  );
}

function AmountDisplay({ digits }: { digits: string }) {
  const value = digits === '' ? 0 : parseInt(digits, 10);
  const bump = useRef(new Animated.Value(1)).current;
  const caret = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    bump.setValue(1.045);
    Animated.timing(bump, { toValue: 1, duration: 180, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: nativeDriver }).start();
  }, [digits, bump]);

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(caret, { toValue: 0, duration: 0, delay: 550, useNativeDriver: nativeDriver }),
        Animated.timing(caret, { toValue: 1, duration: 0, delay: 550, useNativeDriver: nativeDriver }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [caret]);

  return (
    <Animated.View style={[styles.amountRow, { transform: [{ scale: bump }] }]}>
      <Text style={styles.rupee}>₹</Text>
      <Text style={[styles.amount, value === 0 && { color: colors.textDisabled }]} aria-live="polite">
        {groupIndian(value)}
      </Text>
      <Animated.View style={[styles.caret, { opacity: caret }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.pageTitle, color: colors.text },
  link: { fontFamily: fonts.medium, fontSize: 14, color: colors.lilac },
  tabs: { flexDirection: 'row', paddingHorizontal: space.screenX, borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { width: TAB_WIDTH, height: 44, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.textFaint },
  indicator: {
    position: 'absolute',
    left: space.screenX,
    bottom: -1,
    width: TAB_WIDTH,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.iris,
  },
  amountArea: { flex: 1, minHeight: 140, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  amountLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rupee: { fontFamily: fonts.expandedMedium, fontSize: 34, color: colors.textFaint, alignSelf: 'flex-start', marginTop: 6 },
  amount: { ...type.amountXL, ...tabular, lineHeight: 68, color: colors.text },
  caret: { width: 3, height: 56, borderRadius: 2, backgroundColor: colors.iris, marginLeft: 2 },
  details: { marginTop: 14, marginHorizontal: space.screenX, borderRadius: radius.card, backgroundColor: colors.surface1, overflow: 'hidden' },
  detailRow: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16 },
  detailPressed: { backgroundColor: colors.surface2 },
  detailText: { flex: 1, minWidth: 0, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  detailMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  divider: { height: 1, backgroundColor: colors.line },
  footer: { paddingTop: 10, paddingHorizontal: space.screenX, paddingBottom: space.xxl, gap: space.sm },
  hint: { textAlign: 'center', fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
});
