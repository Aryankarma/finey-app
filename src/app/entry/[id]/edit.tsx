import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

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
import type { CategoryKey, Entry } from '@/data/seed';
import { currentDay, useEntries, useEntry } from '@/store/entries';
import { categories, expenseCategories, incomeCategories } from '@/ui/categories';
import { formatMoney, longDay } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors } from '@/ui/theme';

// Same layout as New entry, prefilled. Save stays off until something changes.
export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useEntry(id);
  const router = useRouter();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/ledger'));

  if (!entry) {
    return (
      <Screen bottom style={styles.screen}>
        <FormHeader title="Edit entry" onClose={close} />
        <Text style={[formStyles.hint, { marginTop: 40 }]}>This entry no longer exists.</Text>
      </Screen>
    );
  }
  return <EditForm entry={entry} onClose={close} />;
}

function EditForm({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const updateEntry = useEntries((s) => s.updateEntry);
  const today = currentDay();
  const [type, setType] = useState(entry.type);
  const [digits, setDigits] = useState(String(entry.amount));
  const [category, setCategory] = useState<CategoryKey | null>(entry.category);
  const [name, setName] = useState(entry.name);
  const [date, setDate] = useState(entry.date);
  const [dateOpen, setDateOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const amount = digits === '' ? 0 : parseInt(digits, 10);
  const trimmed = name.trim();
  const changed =
    type !== entry.type || amount !== entry.amount || category !== entry.category || trimmed !== entry.name || date !== entry.date;
  const hint =
    amount === 0
      ? 'Enter an amount to save this.'
      : category === null
        ? 'Pick a category to save this.'
        : trimmed === ''
          ? 'Add a description to save this.'
          : !changed
            ? 'Change something to save it.'
            : '';

  const save = () => {
    if (hint || category === null) return;
    updateEntry(entry.id, { type, amount, category, name: trimmed, date });
    setSaved(true);
  };

  return (
    <Screen bottom style={styles.screen}>
      <FormHeader title="Edit entry" closeLabel="Close without saving" onClose={onClose} />

      <TypeTabs
        value={type}
        onChange={(t) => {
          if (t === type) return;
          setType(t);
          setCategory(null);
        }}
      />

      <AmountDisplay digits={digits} note={amount !== entry.amount && amount !== 0 ? `Was ${formatMoney(entry.amount)}` : ''} />

      <CategoryChips key={type} options={type === 'income' ? incomeCategories : expenseCategories} value={category} onChange={setCategory} />

      <DetailsCard>
        <View style={formStyles.detailRow}>
          <Icon name="lines" size={18} color={colors.textFaint} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="What was it for?"
            placeholderTextColor={colors.textFaint}
            accessibilityLabel="Description"
            style={[formStyles.detailText, styles.input]}
          />
        </View>
        <DetailDivider />
        <DetailRow icon="calendar" text={longDay(date, today).replace(/^(Today|Yesterday), /, '')} chevron onPress={() => setDateOpen(true)} />
      </DetailsCard>

      <Keypad
        onKey={(d) => {
          const next = appendDigits(digits, d);
          if (next !== null) setDigits(next);
        }}
        onBackspace={() => setDigits(digits.slice(0, -1))}
      />

      <View style={formStyles.footer}>
        {hint !== '' && <Text style={formStyles.hint} role="status">{hint}</Text>}
        <PrimaryButton label="Save changes" disabled={hint !== ''} onPress={save} />
      </View>

      <DatePickerSheet
        visible={dateOpen}
        value={date}
        today={today}
        onClose={() => setDateOpen(false)}
        onPick={(d) => {
          setDate(d);
          setDateOpen(false);
        }}
      />
      <ResultSheet
        visible={saved}
        title="Changes saved"
        message={`${trimmed} is now ${formatMoney(amount)} under ${category ? categories[category].label : 'Other'}.`}
        secondaryLabel="Keep editing"
        onSecondary={() => setSaved(false)}
        onDone={() => {
          setSaved(false);
          onClose();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  input: { height: '100%', ...Platform.select<object>({ web: { outlineStyle: 'none' }, default: {} }) },
});
