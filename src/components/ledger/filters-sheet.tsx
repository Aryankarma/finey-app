import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Segmented } from '@/components/segmented';
import { Sheet } from '@/components/sheet';
import { SwitchMark } from '@/components/switch';
import { useEntries } from '@/store/entries';
import {
  defaultFilters,
  isDefaultFilters,
  ledgerEntries,
  sortLabels,
  useLedger,
  type LedgerFilters,
  type LedgerShow,
  type LedgerSort,
} from '@/store/ledger';
import { useViewDay } from '@/store/view-month';
import { Icon } from '@/ui/icons';
import { colors, fonts } from '@/ui/theme';

const SHOWS: { key: LedgerShow; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'expense', label: 'Expenses' },
  { key: 'income', label: 'Income' },
];
const SORTS = Object.keys(sortLabels) as LedgerSort[];

// Filter and sort for the Ledger list. Changes apply only when you press the button.
export function FiltersSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const ledger = useLedger();
  const entries = useEntries((s) => s.entries);
  const viewDay = useViewDay();
  const [draft, setDraft] = useState<LedgerFilters>(defaultFilters);

  useEffect(() => {
    if (visible) setDraft({ show: ledger.show, savedOnly: ledger.savedOnly, sort: ledger.sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const count = useMemo(() => ledgerEntries(entries, viewDay, draft, ledger.query).length, [entries, viewDay, draft, ledger.query]);
  const patch = (p: Partial<LedgerFilters>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} role="heading">Filter and sort</Text>
          <Pressable onPress={() => setDraft(defaultFilters)} disabled={isDefaultFilters(draft)} style={styles.reset}>
            <Text style={[styles.resetLabel, isDefaultFilters(draft) && { opacity: 0.35 }]}>Reset</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Show</Text>
        <Segmented label="Show" options={SHOWS} value={draft.show} onChange={(show) => patch({ show })} />

        <Pressable role="switch" aria-checked={draft.savedOnly} onPress={() => patch({ savedOnly: !draft.savedOnly })} style={styles.switchRow}>
          <View style={styles.switchIcon}>
            <Icon
              name="bookmark"
              size={18}
              color={draft.savedOnly ? colors.lilac : colors.textMuted}
              fill={draft.savedOnly ? colors.lilac : 'none'}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.rowLabel}>Only saved entries</Text>
            <Text style={styles.rowSub}>Entries you saved for later</Text>
          </View>
          <SwitchMark on={draft.savedOnly} />
        </Pressable>

        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Sort by</Text>
        <View role="radiogroup">
          {SORTS.map((key, i) => {
            const on = draft.sort === key;
            return (
              <Pressable key={key} role="radio" aria-checked={on} onPress={() => patch({ sort: key })} style={[styles.radioRow, i > 0 && styles.radioDivider]}>
                <Text style={styles.rowLabel}>{sortLabels[key]}</Text>
                <View style={[styles.ring, on && { borderColor: colors.iris }]}>{on && <View style={styles.ringDot} />}</View>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          label={count === 0 ? 'No entries match' : `Show ${count} ${count === 1 ? 'entry' : 'entries'}`}
          disabled={count === 0}
          onPress={() => {
            ledger.setFilters(draft);
            onClose();
          }}
          style={{ marginTop: 18 }}
        />
      </View>
    </Sheet>
  );
}


const styles = StyleSheet.create({
  body: { paddingHorizontal: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4, marginBottom: 14 },
  title: { fontFamily: fonts.expandedSemibold, fontSize: 20, color: colors.text },
  reset: { height: 44, paddingHorizontal: 4, justifyContent: 'center' },
  resetLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.lilac },
  sectionLabel: { marginBottom: 10, fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, marginTop: 8 },
  switchIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  rowSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  radioRow: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  radioDivider: { borderTopWidth: 1, borderTopColor: '#1C1C21' },
  ring: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#4A4A54', alignItems: 'center', justifyContent: 'center' },
  ringDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.lilac },
});
