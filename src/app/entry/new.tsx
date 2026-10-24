import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryChips } from '@/components/category-chips';
import { DatePickerSheet } from '@/components/date-picker-sheet';
import {
  AmountDisplay,
  appendDigits,
  DetailDivider,
  DetailRow,
  DetailsCard,
  FormHeader,
  formStyles,
  TypeTabs,
} from '@/components/entry-form';
import { Keypad } from '@/components/keypad';
import { PrimaryButton } from '@/components/primary-button';
import { ResultSheet } from '@/components/result-sheet';
import { Screen } from '@/components/screen';
import type { Entry } from '@/data/seed';
import { useEntryDraft } from '@/store/entry-draft';
import { currentDay, useEntries } from '@/store/entries';
import { descriptionHistory } from '@/store/summary';
import { categories, expenseCategories, incomeCategories } from '@/ui/categories';
import { formatMoney, longDay, relativeDay } from '@/ui/format';
import { colors } from '@/ui/theme';

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
    <Screen bottom style={styles.screen}>
      <FormHeader
        title="New entry"
        onClose={close}
        right={
          <Pressable onPress={() => router.push('/entry/paste')} hitSlop={8}>
            <Text style={formStyles.link}>Paste text instead</Text>
          </Pressable>
        }
      />

      <TypeTabs value={draft.type} onChange={(t) => t !== draft.type && draft.set({ type: t, category: null })} />

      <AmountDisplay digits={draft.amount} />

      <CategoryChips
        key={draft.type}
        options={draft.type === 'income' ? incomeCategories : expenseCategories}
        value={draft.category}
        onChange={(category) => draft.set({ category })}
      />

      <DetailsCard>
        <DetailRow
          icon="lines"
          text={draft.name || 'What was it for?'}
          placeholder={!draft.name}
          meta={known ? `Used ${known.uses} ${known.uses === 1 ? 'time' : 'times'}` : undefined}
          onPress={() => router.push('/entry/describe')}
          accessibilityLabel={draft.name ? `Description, ${draft.name}. Change it` : 'Add a description'}
        />
        <DetailDivider />
        <DetailRow
          icon="calendar"
          text={longDay(draft.date, today)}
          chevron
          onPress={() => setDateOpen(true)}
          accessibilityLabel={`Date, ${longDay(draft.date, today)}. Change date`}
        />
      </DetailsCard>

      <Keypad
        onKey={(digits) => {
          const next = appendDigits(draft.amount, digits);
          if (next !== null) draft.set({ amount: next });
        }}
        onBackspace={() => draft.set({ amount: draft.amount.slice(0, -1) })}
      />

      <View style={formStyles.footer}>
        {blocked && (
          <Text style={formStyles.hint} role="status">
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
      <ResultSheet
        visible={recorded !== null}
        title="Recorded"
        message={recordedMessage}
        secondaryLabel="Add another"
        onSecondary={() => {
          setRecorded(null);
          draft.reset({ type: draft.type });
        }}
        onDone={() => {
          setRecorded(null);
          close();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
