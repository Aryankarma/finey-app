import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Amount } from '@/components/amount';
import { PrimaryButton } from '@/components/primary-button';
import { Sheet } from '@/components/sheet';
import { SwitchMark } from '@/components/switch';
import type { Entry } from '@/data/seed';
import { useAccent } from '@/hooks/use-accent';
import { deleteEntryWithUndo } from '@/store/actions';
import { useEntries, useEntry } from '@/store/entries';
import { signedAmount } from '@/store/ledger';
import { categories } from '@/ui/categories';
import { formatMoney, fullDate } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts } from '@/ui/theme';

const sources: Record<NonNullable<Entry['source']>, string> = {
  keypad: 'With the keypad',
  voice: 'By voice',
  paste: 'From pasted text',
};

function addedLabel(entry: Entry): string | null {
  if (!entry.source) return null;
  if (!entry.createdAt) return sources[entry.source];
  const time = new Date(entry.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  return `${sources[entry.source]}, ${time}`;
}

// Entry details over the Ledger. Delete closes it and offers Undo; Edit hands off to Edit entry.
export function EntrySheet({ entryId, onClose, onEdit }: { entryId: string | null; onClose: () => void; onEdit: (id: string) => void }) {
  const live = useEntry(entryId);
  const accent = useAccent();
  const toggleSaved = useEntries((s) => s.toggleSaved);
  // Keep showing the last entry while the sheet slides away.
  const last = useRef<Entry | undefined>(undefined);
  if (live) last.current = live;
  const entry = live ?? last.current;

  const pop = useRef(new Animated.Value(1)).current;
  const popSaved = () => {
    pop.setValue(1);
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.3, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pop, { toValue: 1, duration: 230, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };

  useEffect(() => {
    // Entry was deleted elsewhere while open.
    if (entryId && !live) onClose();
  }, [entryId, live, onClose]);

  if (!entry) return null;

  const c = categories[entry.category];
  const income = entry.type === 'income';
  const added = addedLabel(entry);
  const rows: [string, ReactNode][] = [
    ['Date', fullDate(entry.date)],
    [
      'Category',
      <View key="c" style={styles.catValue}>
        <View style={[styles.dot, { backgroundColor: c.color }]} />
        <Text style={styles.value}>{c.label}</Text>
      </View>,
    ],
    ['Type', income ? 'Income' : 'Expense'],
    ...(added ? ([['Added', added]] as [string, string][]) : []),
  ];

  return (
    <Sheet visible={!!live} onClose={onClose}>
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={[styles.badge, { backgroundColor: `${c.color}24` }]}>
            <Icon name={c.icon} size={22} color={c.color} />
          </View>
          <Pressable onPress={onClose} accessibilityLabel="Close" style={({ pressed }) => [styles.close, pressed && { transform: [{ scale: 0.94 }] }]}>
            <Icon name="close" size={18} color={colors.text} strokeWidth={1.9} />
          </Pressable>
        </View>
        <Text style={styles.title} role="heading">{entry.name}</Text>
        <Amount style={[styles.amount, income && { color: colors.mint }]}>{formatMoney(signedAmount(entry), { signed: true })}</Amount>

        <View style={styles.list}>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.listRow}>
              <Text style={styles.label}>{label}</Text>
              {typeof value === 'string' ? <Text style={styles.value}>{value}</Text> : value}
            </View>
          ))}
        </View>

        <Pressable
          role="switch"
          aria-checked={!!entry.saved}
          onPress={() => {
            toggleSaved(entry.id);
            popSaved();
          }}
          style={styles.saveRow}>
          <Animated.View style={[styles.saveIcon, { transform: [{ scale: pop }] }]}>
            <Icon name="bookmark" size={18} color={entry.saved ? accent.lilac : colors.textMuted} fill={entry.saved ? accent.lilac : 'none'} />
          </Animated.View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.value}>Save for later</Text>
            <Text style={styles.label}>{entry.saved ? 'Shows up under Saved in the ledger' : 'Keep it handy under Saved'}</Text>
          </View>
          <SwitchMark on={!!entry.saved} />
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              onClose();
              deleteEntryWithUndo(entry.id);
            }}
            style={({ pressed }) => [styles.delete, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Icon name="trash" size={18} color={colors.rose} />
            <Text style={styles.deleteLabel}>Delete</Text>
          </Pressable>
          <PrimaryButton label="Edit" icon="edit" height={54} onPress={() => onEdit(entry.id)} style={{ flex: 1 }} />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 4 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -2 },
  badge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 16, fontFamily: fonts.expandedSemibold, fontSize: 22, color: colors.text },
  amount: { marginTop: 4, fontFamily: fonts.expandedSemibold, fontSize: 40, letterSpacing: -0.8, lineHeight: 44, color: colors.text },
  list: { marginTop: 18, borderTopWidth: 1, borderTopColor: '#1C1C21' },
  listRow: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#1C1C21' },
  label: { fontFamily: fonts.regular, fontSize: 14, color: colors.textFaint },
  value: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  catValue: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, paddingVertical: 12 },
  saveIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  delete: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.roseTint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.rose },
});
