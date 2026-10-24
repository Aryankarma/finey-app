import { useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Debt } from '@/data/seed';
import { useAccent } from '@/hooks/use-accent';
import { kindLabels } from '@/store/debts';
import { groupIndian } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, tabular } from '@/ui/theme';

// Fields shared by New record and Edit a record.

const KINDS = Object.keys(kindLabels) as Debt['kind'][];
const noOutline = Platform.select<object>({ web: { outlineStyle: 'none' }, default: {} });

export function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

// Big typed amount with an underline that turns purple while focused, pink on error.
export function AmountField({
  digits,
  onChange,
  color = colors.text,
  size = 44,
  error = false,
}: {
  digits: string;
  onChange: (digits: string) => void;
  color?: string;
  size?: number;
  error?: boolean;
}) {
  const accent = useAccent();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.amount}>
      <Text style={[styles.rupee, { fontSize: size * 0.68 }]}>₹</Text>
      <TextInput
        value={digits ? groupIndian(parseInt(digits, 10)) : ''}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, 8))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.textDisabled}
        accessibilityLabel="Amount"
        style={[styles.amountInput, { fontSize: size, color }, noOutline]}
      />
      <View style={[styles.underline, focused && { backgroundColor: accent.iris }, error && { backgroundColor: colors.rose }]} />
    </View>
  );
}

export function PersonField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.field}>
      <Icon name="person" size={18} color={colors.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Who is it?"
        placeholderTextColor={colors.textFaint}
        accessibilityLabel="Person"
        autoComplete="off"
        style={[styles.fieldInput, noOutline]}
      />
    </View>
  );
}

// Side-scrolling chips; works as a radio group or, with `initial`, as person shortcuts.
export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroller} contentContainerStyle={styles.chipRow}>
      {children}
    </ScrollView>
  );
}

export function Chip({ label, on, onPress, initial }: { label: string; on: boolean; onPress: () => void; initial?: string }) {
  const accent = useAccent();
  return (
    <Pressable
      onPress={onPress}
      role="radio"
      aria-checked={on}
      style={({ pressed }) => [styles.chip, initial !== undefined && styles.personChip, on && { backgroundColor: accent.irisTint, borderColor: accent.iris }, pressed && { transform: [{ scale: 0.96 }] }]}>
      {initial !== undefined && (
        <View style={styles.initial}>
          <Text style={styles.initialText}>{initial}</Text>
        </View>
      )}
      <Text style={[styles.chipLabel, on && { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function KindChips({ value, onChange }: { value: Debt['kind']; onChange: (k: Debt['kind']) => void }) {
  return (
    <ChipRow>
      {KINDS.map((k) => (
        <Chip key={k} label={kindLabels[k]} on={value === k} onPress={() => onChange(k)} />
      ))}
    </ChipRow>
  );
}

// Note field and date row in one card.
export function NoteDateCard({ note, onNote, dateLabel, onDate }: { note: string; onNote: (v: string) => void; dateLabel: string; onDate: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Icon name="lines" size={18} color={colors.textFaint} />
        <TextInput
          value={note}
          onChangeText={onNote}
          placeholder="What was it for? Optional"
          placeholderTextColor={colors.textFaint}
          accessibilityLabel="Note"
          style={[styles.fieldInput, noOutline]}
        />
      </View>
      <Pressable onPress={onDate} style={({ pressed }) => [styles.cardRow, styles.cardDivider, pressed && { backgroundColor: colors.surface2 }]}>
        <Icon name="calendar" size={18} color={colors.textFaint} />
        <Text style={styles.cardText}>{dateLabel}</Text>
        <Icon name="chevronRight" size={16} color={colors.textFaint} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 8, fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  amount: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 10 },
  rupee: { fontFamily: fonts.expandedMedium, color: colors.textFaint },
  amountInput: { flex: 1, minWidth: 0, fontFamily: fonts.expandedSemibold, letterSpacing: -0.8, ...tabular },
  underline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, borderRadius: 2, backgroundColor: colors.surface4 },
  field: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  fieldInput: { flex: 1, minWidth: 0, height: '100%', fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  chipScroller: { flexGrow: 0, marginHorizontal: -20 },
  chipRow: { gap: 8, paddingHorizontal: 20 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.surface2, justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  personChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, paddingRight: 14 },
  chipLabel: { fontFamily: fonts.medium, fontSize: 14, color: '#D9D9DE' },
  initial: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface4, alignItems: 'center', justifyContent: 'center' },
  initialText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  card: { borderRadius: 18, backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  cardRow: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  cardDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  cardText: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
});
