import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Sheet } from '@/components/sheet';
import { SwitchMark } from '@/components/switch';
import { currentDay, useEntries } from '@/store/entries';
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
  const [draft, setDraft] = useState<LedgerFilters>(defaultFilters);

  useEffect(() => {
    if (visible) setDraft({ show: ledger.show, savedOnly: ledger.savedOnly, sort: ledger.sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const count = useMemo(() => ledgerEntries(entries, currentDay(), draft, ledger.query).length, [entries, draft, ledger.query]);
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
        <Segmented value={draft.show} onChange={(show) => patch({ show })} />

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

function Segmented({ value, onChange }: { value: LedgerShow; onChange: (v: LedgerShow) => void }) {
  const [width, setWidth] = useState(0);
  const index = SHOWS.findIndex((s) => s.key === value);
  const x = useRef(new Animated.Value(index)).current;
  const thumb = (width - 8) / SHOWS.length;

  useEffect(() => {
    Animated.timing(x, { toValue: index, duration: 300, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [index, x]);

  return (
    <View role="radiogroup" style={styles.seg} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Animated.View
          style={[styles.thumb, { width: thumb, transform: [{ translateX: Animated.multiply(x, thumb) }] }]}
        />
      )}
      {SHOWS.map((s) => (
        <Pressable key={s.key} role="radio" aria-checked={value === s.key} onPress={() => onChange(s.key)} style={styles.segItem}>
          <Text style={[styles.segLabel, value === s.key && styles.segLabelOn]}>{s.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4, marginBottom: 14 },
  title: { fontFamily: fonts.expandedSemibold, fontSize: 20, color: colors.text },
  reset: { height: 44, paddingHorizontal: 4, justifyContent: 'center' },
  resetLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.lilac },
  sectionLabel: { marginBottom: 10, fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  seg: { height: 48, padding: 4, borderRadius: 24, backgroundColor: colors.surface3, flexDirection: 'row' },
  thumb: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 20,
    backgroundColor: '#2C2C34',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  segLabelOn: { fontFamily: fonts.semibold, color: colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, marginTop: 8 },
  switchIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  rowSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  radioRow: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  radioDivider: { borderTopWidth: 1, borderTopColor: '#1C1C21' },
  ring: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#4A4A54', alignItems: 'center', justifyContent: 'center' },
  ringDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.lilac },
});
