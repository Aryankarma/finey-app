import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { appendDigits } from '@/components/entry-form';
import { Keypad } from '@/components/keypad';
import { PersonRing } from '@/components/people/person-ring';
import { kindNoun, methodFromNote, theyOwe } from '@/components/people/debt-text';
import { PrimaryButton } from '@/components/primary-button';
import { Sheet } from '@/components/sheet';
import type { Debt } from '@/data/seed';
import { paidSoFar, useDebt, useDebts } from '@/store/debts';
import { currentDay } from '@/store/entries';
import { formatMoney, groupIndian } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, tabular } from '@/ui/theme';

const BIG_R = 44;
const BIG_C = 2 * Math.PI * BIG_R;

// Record a payment against a debt: keypad amount, 50% / 75% / all quick picks, and a done ring.
export function PaymentSheet({ debtId, onClose }: { debtId: string | null; onClose: () => void }) {
  const live = useDebt(debtId);
  const addPayment = useDebts((s) => s.addPayment);
  const last = useRef<Debt | undefined>(undefined);
  if (live) last.current = live;
  const debt = live ?? last.current;

  const [digits, setDigits] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState<{ before: number; amount: number } | null>(null);

  useEffect(() => {
    if (debtId) {
      setDigits('');
      setNote('');
      setDone(null);
    }
  }, [debtId]);

  if (!debt) return null;

  const paid = done ? done.before : paidSoFar(debt);
  const left = debt.amount - paid;
  const amount = digits === '' ? 0 : parseInt(digits, 10);
  const over = amount > left;
  const blocked = amount === 0 || over;
  const now = Math.min(amount, left);
  const them = theyOwe(debt);

  const caption = over
    ? { text: `That's more than the ${formatMoney(left)} still ${them ? 'owed' : 'to pay'}`, color: colors.rose }
    : amount === 0
      ? { text: them ? `Enter what ${debt.person} paid` : 'Enter what you paid', color: colors.textMuted }
      : amount === left
        ? { text: 'Fully paid back after this', color: colors.mint }
        : { text: `${formatMoney(left - amount)} will still be ${them ? 'owed' : 'left to pay'}`, color: colors.textMuted };

  // Quick picks bring the total paid back to 50%, 75% or all of it.
  const picks = [
    { label: '50%', value: Math.round(debt.amount * 0.5) - paid },
    { label: '75%', value: Math.round(debt.amount * 0.75) - paid },
    { label: 'All of it', value: left },
  ].filter((p) => p.value > 0);

  const record = () => {
    if (blocked) return;
    addPayment(debt.id, { date: currentDay(), amount, method: methodFromNote(note) });
    setDone({ before: paid, amount });
  };

  return (
    <Sheet visible={!!live} onClose={onClose}>
      {done ? (
        <DoneView debt={debt} before={done.before} amount={done.amount} onDone={onClose} />
      ) : (
        <View style={styles.body}>
          <View style={styles.who}>
            <PersonRing name={debt.person} paid={paid / debt.amount} color={them ? colors.mint : colors.iris} fill={colors.surface3} />
            <View style={{ gap: 3, flex: 1 }}>
              <Text style={styles.title} role="heading">{them ? `${debt.person} is paying you back` : `You're paying ${debt.person} back`}</Text>
              <Text style={styles.muted}>
                <Text style={styles.strong}>{formatMoney(left)}</Text> of {formatMoney(debt.amount)} is still {them ? 'to come' : 'to pay'}
              </Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.rupee}>₹</Text>
            <Text style={[styles.amount, amount === 0 && { color: colors.textDisabled }, over && { color: colors.rose }]} aria-label="Amount">
              {groupIndian(amount)}
            </Text>
            <View style={styles.caret} />
          </View>

          <View>
            <View style={styles.bar} role="img">
              {paid > 0 && <View style={[styles.seg, { flexGrow: paid, backgroundColor: colors.lilac }]} />}
              {now > 0 && <View style={[styles.seg, { flexGrow: now, backgroundColor: colors.mint }]} />}
              {left - now > 0 && <View style={[styles.seg, { flexGrow: left - now, backgroundColor: colors.surface3 }]} />}
            </View>
            <View style={styles.barLabels}>
              <Text style={styles.barLeft}>{paid > 0 ? `${formatMoney(paid)} paid earlier` : 'Nothing paid yet'}</Text>
              <Text style={[styles.caption, { color: caption.color }]} role="status">{caption.text}</Text>
            </View>
          </View>

          <View style={styles.picks} role="radiogroup" aria-label="Bring the total paid back to">
            {picks.map((p) => {
              const on = amount === p.value;
              return (
                <Pressable
                  key={p.label}
                  role="radio"
                  aria-checked={on}
                  onPress={() => setDigits(String(p.value))}
                  style={({ pressed }) => [styles.pick, on && styles.pickOn, pressed && { transform: [{ scale: 0.96 }] }]}>
                  <Text style={styles.pickLabel}>{p.label}</Text>
                  <Text style={[styles.pickValue, on && { color: '#DCD7FF' }]}>{formatMoney(p.value)}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.note}>
            <Icon name="lines" size={16} color={colors.textFaint} />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note, like paid by UPI"
              placeholderTextColor={colors.textFaint}
              accessibilityLabel="Note"
              style={styles.noteInput}
            />
          </View>

          <Keypad
            compact
            onKey={(d) => {
              const next = appendDigits(digits, d);
              if (next !== null && next.length <= 6) setDigits(next);
            }}
            onBackspace={() => setDigits(digits.slice(0, -1))}
          />

          <PrimaryButton
            label={blocked ? 'Record payment' : them ? `Record ${formatMoney(amount)} from ${debt.person}` : `Record ${formatMoney(amount)} to ${debt.person}`}
            disabled={blocked}
            onPress={record}
          />
        </View>
      )}
    </Sheet>
  );
}

function DoneView({ debt, before, amount, onDone }: { debt: Debt; before: number; amount: number; onDone: () => void }) {
  const after = before + amount;
  const full = after >= debt.amount;
  const share = Math.min(1, after / debt.amount);
  const them = theyOwe(debt);
  return (
    <View style={styles.done} role="status">
      <View style={styles.bigRing}>
        <Svg width={112} height={112} viewBox="0 0 112 112">
          <Circle cx={56} cy={56} r={BIG_R} fill="none" stroke={colors.surface3} strokeWidth={8} />
          <Circle
            cx={56}
            cy={56}
            r={BIG_R}
            fill="none"
            stroke={colors.mint}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${(share * BIG_C).toFixed(1)} ${BIG_C.toFixed(1)}`}
            transform="rotate(-90 56 56)"
          />
          {full && <Path d="M40 57l11 11 22-24" fill="none" stroke={colors.mint} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />}
        </Svg>
        {!full && <Text style={styles.pct}>{Math.round(share * 100)}%</Text>}
      </View>
      <Text style={styles.doneTitle}>
        {full ? (them ? `${debt.person} has paid you back` : `You've paid ${debt.person} back`) : 'Payment recorded'}
      </Text>
      <Text style={styles.doneText}>
        {full
          ? `The ${kindNoun(debt)} is settled and moves to Settled.`
          : them
            ? `${formatMoney(debt.amount - after)} is still to come from ${debt.person}.`
            : `You still owe ${debt.person} ${formatMoney(debt.amount - after)}.`}
      </Text>
      <PrimaryButton label="Done" onPress={onDone} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, marginTop: -2 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontFamily: fonts.expandedSemibold, fontSize: 17, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, ...tabular },
  strong: { color: colors.text },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 6, paddingBottom: 2 },
  rupee: { fontFamily: fonts.expandedMedium, fontSize: 28, color: colors.textFaint, alignSelf: 'flex-start', marginTop: 4 },
  amount: { fontFamily: fonts.expandedSemibold, fontSize: 52, letterSpacing: -1, lineHeight: 56, color: colors.text, ...tabular },
  caret: { width: 3, height: 46, borderRadius: 2, backgroundColor: colors.iris, marginLeft: 2 },
  bar: { flexDirection: 'row', gap: 3, height: 8 },
  seg: { flexBasis: 0, borderRadius: 4 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 8 },
  barLeft: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, ...tabular },
  caption: { flexShrink: 1, textAlign: 'right', fontFamily: fonts.semibold, fontSize: 12, ...tabular },
  picks: { flexDirection: 'row', gap: 8 },
  pick: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pickOn: { backgroundColor: colors.irisTint, borderColor: colors.iris },
  pickLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  pickValue: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, ...tabular },
  note: { height: 48, borderRadius: 24, backgroundColor: colors.surface3, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  noteInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    ...Platform.select<object>({ web: { outlineStyle: 'none' }, default: {} }),
  },
  done: { alignItems: 'center', gap: 14, paddingTop: 28, paddingHorizontal: 8, paddingBottom: 8 },
  bigRing: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center' },
  pct: { position: 'absolute', fontFamily: fonts.expandedSemibold, fontSize: 20, color: colors.text, ...tabular },
  doneTitle: { marginTop: 6, fontFamily: fonts.expandedSemibold, fontSize: 21, color: colors.text, textAlign: 'center' },
  doneText: { marginBottom: 10, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center' },
});
