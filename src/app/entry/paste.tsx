import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { FormHeader, formStyles } from '@/components/entry-form';
import { ParsedEditSheet } from '@/components/parsed-edit-sheet';
import { ParsedRow } from '@/components/parsed-row';
import { PrimaryButton } from '@/components/primary-button';
import { ResultSheet } from '@/components/result-sheet';
import { Screen } from '@/components/screen';
import { useAccent } from '@/hooks/use-accent';
import { currentDay, useEntries } from '@/store/entries';
import { parseLine, type ParsedEntry } from '@/store/parse-entries';
import { usePasteHandoff } from '@/store/paste-handoff';
import { formatMoney, monthName, shortDay } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, space } from '@/ui/theme';

type Phase = 'write' | 'reading' | 'review';
const MAX_LINES = 8;
const READ_MS = 900;

// Paste text: one entry per line. Read, review (possible repeats start unticked), then save.
export default function PasteScreen() {
  const router = useRouter();
  const accent = useAccent();
  // Text from Home's quick-add box, if that's how we got here.
  const [handed] = useState(() => usePasteHandoff.getState().text);
  const entries = useEntries((s) => s.entries);
  const addEntry = useEntries((s) => s.addEntry);
  const today = currentDay();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const [text, setText] = useState(handed ?? '');
  const [phase, setPhase] = useState<Phase>('write');
  const [rows, setRows] = useState<ParsedEntry[]>([]);
  const [ticks, setTicks] = useState<boolean[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [saved, setSaved] = useState<{ count: number; out: number; in: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const count = Math.min(lines.length, MAX_LINES);

  const find = () => {
    if (count === 0) return;
    const picked = lines.slice(0, MAX_LINES);
    setPhase('reading');
    timer.current = setTimeout(() => {
      const parsed = picked.map((l) => parseLine(l, today, entries));
      setRows(parsed);
      setTicks(parsed.map((r) => r.amount > 0 && !r.duplicateOf));
      setPhase('review');
    }, READ_MS);
  };

  // Text shared from Home's quick-add box goes straight to reading.
  useEffect(() => {
    usePasteHandoff.getState().take();
    if (handed) find();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ticked = rows.filter((_, i) => ticks[i]);
  const toCheck = rows.filter((r) => r.duplicateOf || r.amount === 0).length;

  const save = () => {
    if (ticked.length === 0) return;
    for (const r of ticked) addEntry({ name: r.name, amount: r.amount, type: r.type, category: r.category, date: r.date, source: 'paste' });
    setSaved({
      count: ticked.length,
      out: ticked.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0),
      in: ticked.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0),
    });
  };

  const savedParts = saved ? [saved.out > 0 && `${formatMoney(saved.out)} of spending`, saved.in > 0 && `${formatMoney(saved.in)} of income`].filter(Boolean) : [];

  return (
    <Screen bottom>
      <FormHeader
        title="Paste text"
        onClose={close}
        right={
          <Pressable onPress={() => router.replace('/entry/voice')} style={styles.voice}>
            <Icon name="mic" size={16} color={accent.lilac} />
            <Text style={[formStyles.link, { color: accent.lilac }]}>Use voice</Text>
          </Pressable>
        }
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {phase === 'write' && (
          <View>
            <Text style={styles.intro}>Paste or type a few lines. Each line becomes one entry, and nothing is saved until you check them.</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="top"
              autoCorrect={false}
              placeholder="Spent 450 on groceries yesterday"
              placeholderTextColor={colors.textFaint}
              accessibilityLabel="Lines to turn into entries"
              style={styles.textarea}
            />
            <View style={styles.countRow}>
              <Text style={styles.count}>
                {lines.length === 0
                  ? 'No lines yet'
                  : lines.length === 1
                    ? '1 line'
                    : lines.length > MAX_LINES
                      ? `${lines.length} lines, the first ${MAX_LINES} will be read`
                      : `${lines.length} lines`}
              </Text>
              {text.length > 0 && (
                <Pressable onPress={() => setText('')} style={{ height: 44, justifyContent: 'center' }}>
                  <Text style={[formStyles.link, { color: accent.lilac }]}>Clear</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.tips}>
              <Text style={styles.tipsTitle}>Works best with</Text>
              {['One entry per line, with its amount', '“today” or “yesterday” to set the date', '“salary” or “received” for money coming in'].map((t) => (
                <View key={t} style={styles.tip}>
                  <View style={[styles.tipDot, { backgroundColor: accent.iris }]} />
                  <Text style={styles.tipText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {phase === 'reading' && (
          <View>
            <Text style={styles.intro} role="status">Reading {count === 1 ? '1 line' : `${count} lines`}</Text>
            {lines.slice(0, MAX_LINES).map((l, i) => (
              <SkeletonRow key={i} width={110 + ((l.length * 7) % 90)} delay={i * 80} />
            ))}
          </View>
        )}

        {phase === 'review' && (
          <View>
            <Text style={styles.foundTitle}>
              {rows.length === 1 ? 'Found 1 entry' : `Found ${rows.length} entries`}
              {toCheck ? `, ${toCheck} to check` : ''}
            </Text>
            <Text style={styles.foundSub}>Untick anything you don&apos;t want to save, or tap one to change it.</Text>
            {rows.map((r, i) => (
              <ParsedRow
                key={i}
                entry={r}
                on={!!ticks[i]}
                today={today}
                onToggle={() => setTicks(ticks.map((t, j) => (j === i ? !t : t)))}
                onEdit={() => setEditing(i)}
                warning={
                  r.amount === 0
                    ? { text: "We couldn't find an amount in this line. Tap it to add one.", bad: true }
                    : r.duplicateOf
                      ? { text: `You already have ${r.duplicateOf.name} for ${formatMoney(r.duplicateOf.amount)} on ${shortDay(r.duplicateOf.date).slice(4)}. Tick it to save it again.` }
                      : undefined
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[formStyles.footer, { paddingTop: 12 }]}>
        {phase === 'write' && (
          <>
            {count === 0 && <Text style={formStyles.hint} role="status">Paste at least one line to continue.</Text>}
            <PrimaryButton label="Find entries" disabled={count === 0} onPress={find} />
          </>
        )}
        {phase === 'reading' && <PrimaryButton label="Reading" disabled />}
        {phase === 'review' && (
          <>
            {ticked.length === 0 && <Text style={formStyles.hint} role="status">Tick at least one entry to save.</Text>}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => setPhase('write')} style={styles.secondary}>
                <Text style={styles.secondaryLabel}>Edit text</Text>
              </Pressable>
              <PrimaryButton
                label={ticked.length === 1 ? 'Save 1 entry' : `Save ${ticked.length} entries`}
                disabled={ticked.length === 0}
                onPress={save}
                style={{ flex: 1 }}
              />
            </View>
          </>
        )}
      </View>

      <ParsedEditSheet
        entry={editing !== null ? rows[editing] : null}
        today={today}
        onClose={() => setEditing(null)}
        onSave={(changed) => {
          setRows(rows.map((r, i) => (i === editing ? changed : r)));
          setTicks(ticks.map((t, i) => (i === editing ? true : t)));
          setEditing(null);
        }}
      />
      <ResultSheet
        visible={saved !== null}
        title={saved?.count === 1 ? '1 entry saved' : `${saved?.count ?? 0} entries saved`}
        message={`${savedParts.join(' and ')} added to ${monthName(today)}.`}
        secondaryLabel="Paste more"
        onSecondary={() => {
          setSaved(null);
          setText('');
          setRows([]);
          setTicks([]);
          setPhase('write');
        }}
        onDone={() => {
          setSaved(null);
          close();
        }}
      />
    </Screen>
  );
}

// Shimmering placeholder row while lines are being read.
function SkeletonRow({ width, delay }: { width: number; delay: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 550, delay, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, delay]);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  return (
    <Animated.View style={[styles.skelRow, { opacity }]}>
      <View style={[styles.skel, { width: 24, height: 24, borderRadius: 8 }]} />
      <View style={[styles.skel, { width: 40, height: 40, borderRadius: 20 }]} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[styles.skel, { width, height: 12, borderRadius: 6 }]} />
        <View style={[styles.skel, { width: 96, height: 10, borderRadius: 5 }]} />
      </View>
      <View style={[styles.skel, { width: 56, height: 12, borderRadius: 6 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  voice: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  body: { paddingTop: 12, paddingHorizontal: space.screenX, paddingBottom: 12 },
  intro: { marginBottom: 14, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  textarea: {
    height: 236,
    borderRadius: 22,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 28,
    color: colors.text,
    ...Platform.select<object>({ web: { outlineStyle: 'none' }, default: {} }),
  },
  countRow: { height: 44, marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  tips: { marginTop: 10, padding: 16, borderRadius: 18, backgroundColor: '#0E0E11', borderWidth: 1, borderColor: '#17171B', gap: 8 },
  tipsTitle: { marginBottom: 2, fontFamily: fonts.semibold, fontSize: 13, color: '#D9D9DE' },
  tip: { flexDirection: 'row', gap: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  tipText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  skelRow: { height: 72, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surface1, marginBottom: 10 },
  skel: { backgroundColor: '#24242B' },
  foundTitle: { fontFamily: fonts.expandedSemibold, fontSize: 20, color: colors.text },
  foundSub: { marginTop: 6, marginBottom: 16, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  secondary: { width: 132, height: 56, borderRadius: 28, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
});
