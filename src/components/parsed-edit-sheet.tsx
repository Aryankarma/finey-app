import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryChips } from '@/components/category-chips';
import { AmountDisplay, appendDigits, TypeTabs } from '@/components/entry-form';
import { Keypad } from '@/components/keypad';
import { PrimaryButton } from '@/components/primary-button';
import { Sheet } from '@/components/sheet';
import { useAccent } from '@/hooks/use-accent';
import type { ParsedEntry } from '@/store/parse-entries';
import { expenseCategories, incomeCategories } from '@/ui/categories';
import { addDays, shortDay } from '@/ui/format';
import { colors, fonts } from '@/ui/theme';

const RECENT_DAYS = 7;

// Change one heard entry before saving: name, type, amount, category and day.
export function ParsedEditSheet({
  entry,
  today,
  onClose,
  onSave,
}: {
  entry: ParsedEntry | null;
  today: string;
  onClose: () => void;
  onSave: (entry: ParsedEntry) => void;
}) {
  const accent = useAccent();
  const [draft, setDraft] = useState<ParsedEntry | null>(entry);
  const [digits, setDigits] = useState('');

  useEffect(() => {
    if (!entry) return;
    setDraft(entry);
    setDigits(entry.amount > 0 ? String(entry.amount) : '');
  }, [entry]);

  // Today and the six days before it, plus the entry's own day if it's older.
  const days = Array.from({ length: RECENT_DAYS }, (_, i) => addDays(today, -i));
  if (draft && !days.includes(draft.date)) days.push(draft.date);
  const amount = digits === '' ? 0 : parseInt(digits, 10);
  const patch = (p: Partial<ParsedEntry>) => setDraft((d) => (d ? { ...d, ...p } : d));

  return (
    <Sheet visible={entry !== null} onClose={onClose}>
      {draft && (
        <View style={styles.body}>
          <Text style={styles.title} role="heading">Change entry</Text>
          <TextInput
            value={draft.name}
            onChangeText={(name) => patch({ name })}
            placeholder="What was it for?"
            placeholderTextColor={colors.textFaint}
            accessibilityLabel="Description"
            style={styles.name}
          />
          <TypeTabs
            value={draft.type}
            onChange={(type) => type !== draft.type && patch({ type, category: type === 'income' ? 'salary' : 'other' })}
          />
          <AmountDisplay digits={digits} />
          <CategoryChips
            key={draft.type}
            options={draft.type === 'income' ? incomeCategories : expenseCategories}
            value={draft.category}
            onChange={(category) => patch({ category })}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroller} contentContainerStyle={styles.days} role="radiogroup" aria-label="Day">
            {days.map((iso, i) => {
              const on = iso === draft.date;
              return (
                <Pressable
                  key={iso}
                  role="radio"
                  aria-checked={on}
                  onPress={() => patch({ date: iso })}
                  style={[styles.day, on && { backgroundColor: accent.irisTint, borderColor: accent.iris }]}>
                  <Text style={[styles.dayLabel, on && { color: accent.chipText }]}>
                    {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : shortDay(iso).slice(0, -4)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Keypad
            compact
            onKey={(d) => {
              const next = appendDigits(digits, d);
              if (next !== null) setDigits(next);
            }}
            onBackspace={() => setDigits(digits.slice(0, -1))}
          />
          <PrimaryButton
            label="Done"
            disabled={amount === 0}
            onPress={() => onSave({ ...draft, name: draft.name.trim() || draft.name, amount, duplicateOf: undefined })}
            style={{ marginTop: 12 }}
          />
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: 4 },
  title: { fontFamily: fonts.expandedSemibold, fontSize: 20, color: colors.text, marginBottom: 12, paddingHorizontal: 4 },
  name: {
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surface3,
    paddingHorizontal: 16,
    marginBottom: 8,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    ...Platform.select<object>({ web: { outlineStyle: 'none' }, default: {} }),
  },
  dayScroller: { flexGrow: 0, marginTop: 10 },
  days: { gap: 8, paddingHorizontal: 4 },
  day: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surface3, borderWidth: 1, borderColor: 'transparent', justifyContent: 'center' },
  dayLabel: { fontFamily: fonts.medium, fontSize: 13, color: '#D9D9DE' },
});
