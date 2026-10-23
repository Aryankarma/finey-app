import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { useEntryDraft } from '@/store/entry-draft';
import { useEntries } from '@/store/entries';
import { descriptionHistory, type HistoryItem } from '@/store/summary';
import { categories } from '@/ui/categories';
import { formatMoney } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, layout, space, tabular, type } from '@/ui/theme';

const MAX_SUGGESTIONS = 6;

// "What was it for?" Filters past descriptions as you type; picking one also sets its category.
export default function DescribeScreen() {
  const router = useRouter();
  const draft = useEntryDraft();
  const entries = useEntries((s) => s.entries);
  const history = useMemo(() => descriptionHistory(entries), [entries]);
  const [query, setQuery] = useState(draft.name);
  const [picked, setPicked] = useState<HistoryItem | 'new' | null>(null);

  const term = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      history
        .map((h) => ({ h, at: term ? h.name.toLowerCase().indexOf(term) : 0 }))
        .filter((m) => m.at >= 0)
        .slice(0, MAX_SUGGESTIONS),
    [history, term],
  );
  const exact = history.some((h) => h.name.toLowerCase() === term);

  const type = (text: string) => {
    setQuery(text);
    setPicked(null);
  };

  const use = () => {
    if (!term) return;
    if (picked && picked !== 'new') draft.set({ name: picked.name, category: picked.category, type: picked.type });
    else draft.set({ name: query.trim() });
    router.back();
  };

  const note =
    picked === 'new'
      ? { text: "New description. You'll pick its category next.", dot: colors.lilac }
      : picked
        ? { text: `Also sets the category to ${categories[picked.category].label}`, dot: categories[picked.category].color }
        : null;

  return (
    <Screen bottom style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back to the entry" style={({ pressed }) => [styles.iconButton, pressed && { transform: [{ scale: 0.94 }] }]}>
          <Icon name="back" size={18} color={colors.text} strokeWidth={1.9} />
        </Pressable>
        <Text style={styles.title} role="heading">What was it for?</Text>
      </View>

      <View style={styles.top}>
        <View style={styles.field}>
          <Icon name="lines" size={18} color={colors.lilac} />
          <TextInput
            value={query}
            onChangeText={type}
            autoFocus
            autoComplete="off"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={use}
            accessibilityLabel="Description"
            placeholder="Swiggy dinner, rent, cab home"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />
          {query.length > 0 && (
            <Pressable onPress={() => type('')} accessibilityLabel="Clear" style={({ pressed }) => [styles.clear, pressed && { transform: [{ scale: 0.92 }] }]}>
              <Icon name="clear" size={20} color={colors.textFaint} />
            </Pressable>
          )}
        </View>
        <View style={styles.noteSlot}>
          {note && (
            <View style={styles.note} role="status">
              <View style={[styles.noteDot, { backgroundColor: note.dot }]} />
              <Text style={styles.noteText}>{note.text}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
        {matches.length > 0 && (
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>{term ? 'From your history' : 'Most used'}</Text>
            <Text style={styles.listMeta}>Last amount</Text>
          </View>
        )}
        {matches.map(({ h, at }) => {
          const on = picked !== 'new' && picked?.name === h.name;
          const c = categories[h.category];
          return (
            <Pressable
              key={h.name}
              onPress={() => {
                setQuery(h.name);
                setPicked(h);
              }}
              aria-pressed={on}
              style={({ pressed }) => [styles.row, on && styles.rowOn, pressed && !on && styles.rowPressed]}>
              <View style={styles.glyph}>
                <Icon name={c.icon} size={18} color={c.color} />
              </View>
              <View style={styles.rowMiddle}>
                <Text style={[styles.rowName, term && { color: colors.textMuted }]} numberOfLines={1}>
                  {term ? (
                    <>
                      {h.name.slice(0, at)}
                      <Text style={styles.match}>{h.name.slice(at, at + term.length)}</Text>
                      {h.name.slice(at + term.length)}
                    </>
                  ) : (
                    h.name
                  )}
                </Text>
                <Text style={styles.rowMeta}>
                  {c.label}, used {h.uses} {h.uses === 1 ? 'time' : 'times'}
                </Text>
              </View>
              {on && <Icon name="check" size={20} color={colors.mint} strokeWidth={2.2} />}
              <Text style={styles.rowLast}>{formatMoney(h.last)}</Text>
            </Pressable>
          );
        })}
        {term !== '' && matches.length === 0 && <Text style={styles.empty}>Nothing in your history matches that yet.</Text>}
        {term !== '' && !exact && (
          <Pressable
            onPress={() => setPicked('new')}
            aria-pressed={picked === 'new'}
            style={({ pressed }) => [styles.row, picked === 'new' && styles.rowOn, pressed && picked !== 'new' && styles.rowPressed]}>
            <View style={[styles.glyph, { backgroundColor: 'rgba(123,108,246,0.14)' }]}>
              <Icon name="plus" size={18} color={colors.lilac} strokeWidth={2} />
            </View>
            <View style={styles.rowMiddle}>
              <Text style={styles.rowName} numberOfLines={1}>Add “{query.trim()}”</Text>
              <Text style={styles.rowMeta}>Use it as a new description</Text>
            </View>
            {picked === 'new' && <Icon name="check" size={20} color={colors.mint} strokeWidth={2.2} />}
          </Pressable>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!term && <Text style={styles.hint} role="status">Type what it was for, or pick one from your history.</Text>}
        <PrimaryButton label="Use this description" disabled={!term} onPress={use} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { height: layout.headerHeight, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: space.screenX },
  iconButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.pageTitle, color: colors.text },
  top: { paddingTop: 10, paddingHorizontal: space.screenX },
  field: {
    height: 60,
    borderRadius: 30,
    backgroundColor: '#19191D',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 20,
    paddingRight: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(123,108,246,0.65)',
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.text,
    ...Platform.select<object>({ web: { outlineStyle: 'none' }, default: {} }),
  },
  clear: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  noteSlot: { minHeight: 34 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, paddingHorizontal: 4 },
  noteDot: { width: 8, height: 8, borderRadius: 4 },
  noteText: { fontFamily: fonts.regular, fontSize: 13, color: colors.lilacSoft },
  list: { flex: 1 },
  listContent: { paddingTop: 8, paddingHorizontal: space.screenX - 12, paddingBottom: space.lg },
  listHeader: { height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  listTitle: { fontFamily: fonts.expandedSemibold, fontSize: 14, color: colors.textMuted },
  listMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  row: { height: 64, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, borderRadius: 16 },
  rowOn: { backgroundColor: 'rgba(123,108,246,0.14)' },
  rowPressed: { backgroundColor: colors.surface1 },
  glyph: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  rowMiddle: { flex: 1, minWidth: 0, gap: 2 },
  rowName: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  match: { fontFamily: fonts.bold, color: colors.text },
  rowMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  rowLast: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, ...tabular },
  empty: { marginTop: 4, marginBottom: 8, paddingHorizontal: 12, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  footer: { paddingHorizontal: space.screenX, paddingBottom: space.xxl, gap: space.sm },
  hint: { textAlign: 'center', fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
});
