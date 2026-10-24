import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DatePickerSheet } from '@/components/date-picker-sheet';
import { FormHeader, formStyles } from '@/components/entry-form';
import { AmountField, Chip, ChipRow, FieldLabel, KindChips, NoteDateCard, PersonField } from '@/components/people/debt-form';
import { PrimaryButton } from '@/components/primary-button';
import { ResultSheet } from '@/components/result-sheet';
import { Screen } from '@/components/screen';
import type { Debt } from '@/data/seed';
import { useAccent } from '@/hooks/use-accent';
import { useDebts } from '@/store/debts';
import { currentDay } from '@/store/entries';
import { formatMoney, longDay } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts } from '@/ui/theme';

type Direction = Debt['direction'];

// New debt or credit: who owes whom, amount, person, kind, note and date.
export default function NewDebtScreen() {
  const router = useRouter();
  const accent = useAccent();
  const debts = useDebts((s) => s.debts);
  const addDebt = useDebts((s) => s.addDebt);
  const today = currentDay();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/people'));

  const [direction, setDirection] = useState<Direction>('theyOweMe');
  const [digits, setDigits] = useState('');
  const [person, setPerson] = useState('');
  const [kind, setKind] = useState<Debt['kind']>('loan');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today);
  const [dateOpen, setDateOpen] = useState(false);
  const [added, setAdded] = useState<Debt | null>(null);

  // Everyone you've had a record with, most recent first.
  const recentPeople = useMemo(() => [...new Set(debts.map((d) => d.person))], [debts]);

  const amount = digits ? parseInt(digits, 10) : 0;
  const name = person.trim();
  const hint = !name && !amount ? 'Add a name and amount to continue.' : !amount ? 'Add an amount to continue.' : !name ? 'Add a name to continue.' : '';
  const them = direction === 'theyOweMe';

  const reset = () => {
    setDigits('');
    setPerson('');
    setNote('');
    setKind('loan');
    setDate(today);
  };

  return (
    <Screen bottom style={styles.screen}>
      <FormHeader title="New record" onClose={close} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.directions} role="radiogroup" aria-label="Who owes whom">
          <DirectionCard
            on={them}
            onPress={() => setDirection('theyOweMe')}
            icon="arrowIn"
            tint={colors.mint}
            title="They owe me"
            sub="You lent money or paid for them"
          />
          <DirectionCard
            on={!them}
            onPress={() => setDirection('iOweThem')}
            icon="arrowOut"
            tint={accent.iris}
            title="I owe them"
            sub="You borrowed, or they paid for you"
          />
        </View>

        <View>
          <FieldLabel>Amount</FieldLabel>
          <AmountField digits={digits} onChange={setDigits} color={them ? colors.mint : accent.lilacSoft} />
        </View>

        <View>
          <FieldLabel>Person</FieldLabel>
          <PersonField value={person} onChange={setPerson} />
          {recentPeople.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <ChipRow>
                {recentPeople.map((p) => (
                  <Chip key={p} label={p} initial={p[0].toUpperCase()} on={name.toLowerCase() === p.toLowerCase()} onPress={() => setPerson(p)} />
                ))}
              </ChipRow>
            </View>
          )}
        </View>

        <View>
          <FieldLabel>What kind</FieldLabel>
          <KindChips value={kind} onChange={setKind} />
        </View>

        <NoteDateCard note={note} onNote={setNote} dateLabel={longDay(date, today)} onDate={() => setDateOpen(true)} />
      </ScrollView>

      <View style={[formStyles.footer, { paddingTop: 8 }]}>
        {hint !== '' && <Text style={formStyles.hint} role="status">{hint}</Text>}
        <PrimaryButton
          label={hint ? 'Add record' : them ? `Add ${formatMoney(amount)} ${name} owes you` : `Add ${formatMoney(amount)} you owe ${name}`}
          disabled={hint !== ''}
          onPress={() => setAdded(addDebt({ person: name, direction, kind, amount, note: note.trim(), date }))}
        />
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
        visible={added !== null}
        title="Record added"
        message={
          added
            ? `${added.direction === 'theyOweMe' ? `${added.person} owes you ${formatMoney(added.amount)}` : `You owe ${added.person} ${formatMoney(added.amount)}`}. You will find it under People.`
            : ''
        }
        secondaryLabel="Add another"
        onSecondary={() => {
          setAdded(null);
          reset();
        }}
        onDone={() => {
          setAdded(null);
          close();
        }}
      />
    </Screen>
  );
}

function DirectionCard({
  on,
  onPress,
  icon,
  tint,
  title,
  sub,
}: {
  on: boolean;
  onPress: () => void;
  icon: 'arrowIn' | 'arrowOut';
  tint: string;
  title: string;
  sub: string;
}) {
  const accent = useAccent();
  const mint = tint === colors.mint;
  return (
    <Pressable
      role="radio"
      aria-checked={on}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        on && { backgroundColor: mint ? 'rgba(94,224,161,0.07)' : `rgba(${accent.rgb},0.1)`, borderColor: tint, borderWidth: 1.5, padding: 13.5 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}>
      <View
        style={[
          styles.cardIcon,
          { backgroundColor: mint ? 'rgba(94,224,161,0.14)' : `rgba(${accent.rgb},0.18)` },
          on && { transform: [{ rotate: '-8deg' }, { scale: 1.06 }] },
        ]}>
        <Icon name={icon} size={18} color={mint ? colors.mint : accent.lilac} strokeWidth={2} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingTop: 8, paddingHorizontal: 20, paddingBottom: 12, gap: 20 },
  directions: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, gap: 8, padding: 14, borderRadius: 20, backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.line },
  cardIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  cardSub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textFaint },
});
