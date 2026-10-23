import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DatePickerSheet } from '@/components/date-picker-sheet';
import { formStyles } from '@/components/entry-form';
import { AmountField, FieldLabel, KindChips, NoteDateCard, PersonField } from '@/components/people/debt-form';
import { historyLine, kindNoun } from '@/components/people/debt-text';
import { PersonRing } from '@/components/people/person-ring';
import { PrimaryButton } from '@/components/primary-button';
import { ResultSheet } from '@/components/result-sheet';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Sheet } from '@/components/sheet';
import type { Debt } from '@/data/seed';
import { paidSoFar, useDebt, useDebts } from '@/store/debts';
import { currentDay } from '@/store/entries';
import { formatMoney, longDay } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, layout, space, type } from '@/ui/theme';

// Edit a debt. The total can't drop below what's been paid back; delete asks first.
export default function EditDebtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const live = useDebt(id);
  const router = useRouter();
  // Keep the last version so the "Record deleted" sheet can still describe it.
  const last = useRef<Debt | undefined>(undefined);
  if (live) last.current = live;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/people'));

  const debt = live ?? last.current;
  if (!debt) {
    return (
      <Screen bottom style={styles.screen}>
        <Header onBack={close} />
        <Text style={[formStyles.hint, { marginTop: 40 }]}>This record no longer exists.</Text>
      </Screen>
    );
  }
  return <EditForm debt={debt} deleted={!live} onClose={close} />;
}

function EditForm({ debt, deleted, onClose }: { debt: Debt; deleted: boolean; onClose: () => void }) {
  const updateDebt = useDebts((s) => s.updateDebt);
  const removeDebt = useDebts((s) => s.removeDebt);
  const today = currentDay();
  const paid = paidSoFar(debt);

  const [direction, setDirection] = useState(debt.direction);
  const [digits, setDigits] = useState(String(debt.amount));
  const [person, setPerson] = useState(debt.person);
  const [kind, setKind] = useState(debt.kind);
  const [note, setNote] = useState(debt.note);
  const [date, setDate] = useState(debt.date);
  const [dateOpen, setDateOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);

  const amount = digits ? parseInt(digits, 10) : 0;
  const name = person.trim();
  const tooLow = amount > 0 && amount < paid;
  const total = amount >= paid && amount > 0 ? amount : debt.amount;
  const left = total - paid;
  const who = name || debt.person;
  const them = direction === 'theyOweMe';
  const changed =
    direction !== debt.direction || amount !== debt.amount || name !== debt.person || kind !== debt.kind || note.trim() !== debt.note || date !== debt.date;
  const hint = !amount
    ? 'Add an amount to save this.'
    : tooLow
      ? 'Fix the amount to save this.'
      : !name
        ? 'Add a name to save this.'
        : !changed
          ? 'Change something to save it.'
          : '';
  const history = historyLine({ ...debt, direction });

  return (
    <Screen bottom style={styles.screen}>
      <Header onBack={onClose} onDelete={() => setConfirming(true)} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <View style={styles.summaryTop}>
            <PersonRing name={who} paid={paid / total} color={them ? colors.mint : colors.iris} fill="transparent" trackColor={colors.surface4} />
            <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
              <Text style={styles.summaryName}>{who}</Text>
              <Text style={styles.summaryText}>
                {them ? 'Owes you' : 'You owe'} {formatMoney(left)} of {formatMoney(total)}
              </Text>
            </View>
          </View>
          <View style={styles.historyRow}>
            <View style={styles.historyIcon}>
              <Icon name={paid > 0 ? 'check' : 'lines'} size={16} color={colors.mint} strokeWidth={2} />
            </View>
            <Text style={styles.historyText}>{history.text}</Text>
            {history.amount !== undefined && <Text style={styles.historyAmount}>{formatMoney(history.amount)}</Text>}
          </View>
        </View>

        <View>
          <FieldLabel>Who owes whom</FieldLabel>
          <Segmented
            label="Who owes whom"
            options={[
              { key: 'theyOweMe', label: 'They owe me' },
              { key: 'iOweThem', label: 'I owe them' },
            ]}
            value={direction}
            onChange={setDirection}
            background={colors.surface2}
            thumbColor={colors.lineStrong}
          />
        </View>

        <View>
          <FieldLabel>Total amount</FieldLabel>
          <AmountField digits={digits} onChange={setDigits} size={40} error={tooLow} />
          {paid > 0 && (
            <Text style={[styles.amountMsg, tooLow && { color: colors.rose }]} role="status">
              {tooLow
                ? `The total can't be less than the ${formatMoney(paid)} already paid back.`
                : `${formatMoney(paid)} has been paid back. Changing the total keeps that.`}
            </Text>
          )}
        </View>

        <View>
          <FieldLabel>Person</FieldLabel>
          <PersonField value={person} onChange={setPerson} />
        </View>

        <View>
          <FieldLabel>What kind</FieldLabel>
          <KindChips value={kind} onChange={setKind} />
        </View>

        <NoteDateCard note={note} onNote={setNote} dateLabel={longDay(date, today).replace(/^(Today|Yesterday), /, '')} onDate={() => setDateOpen(true)} />
      </ScrollView>

      <View style={[formStyles.footer, { paddingTop: 8 }]}>
        {hint !== '' && <Text style={formStyles.hint} role="status">{hint}</Text>}
        <PrimaryButton
          label="Save changes"
          disabled={hint !== ''}
          onPress={() => {
            updateDebt(debt.id, { direction, amount, person: name, kind, note: note.trim(), date });
            setSaved(true);
          }}
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
        visible={saved}
        title="Changes saved"
        message={them ? `${who} now owes you ${formatMoney(left)}.` : `You now owe ${who} ${formatMoney(left)}.`}
        secondaryLabel="Keep editing"
        onSecondary={() => setSaved(false)}
        onDone={() => {
          setSaved(false);
          onClose();
        }}
      />

      <Modal transparent visible={confirming} animationType="fade" onRequestClose={() => setConfirming(false)}>
        <Pressable style={styles.dialogScrim} onPress={() => setConfirming(false)} accessibilityLabel="Cancel" />
        <View style={styles.dialogWrap} pointerEvents="box-none">
          <View style={styles.dialog} role="alertdialog" aria-modal>
            <View style={[styles.binBadge, { width: 48, height: 48, borderRadius: 24 }]}>
              <Icon name="trash" size={22} color={colors.rose} />
            </View>
            <Text style={styles.dialogTitle}>Delete this record?</Text>
            <Text style={styles.dialogBody}>
              {debt.person}&apos;s {formatMoney(debt.amount)} {kindNoun(debt)} and its payment history will be removed. This can&apos;t be undone.
            </Text>
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setConfirming(false)} style={[styles.dialogButton, { backgroundColor: colors.lineStrong }]}>
                <Text style={styles.dialogButtonLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setConfirming(false);
                  removeDebt(debt.id);
                }}
                style={[styles.dialogButton, { backgroundColor: colors.danger }]}>
                <Text style={[styles.dialogButtonLabel, { fontFamily: fonts.semibold, color: colors.textOnAccent }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Sheet visible={deleted} onClose={onClose}>
        <View style={styles.deleted} role="status">
          <View style={styles.binBadge}>
            <Icon name="trash" size={30} color={colors.rose} strokeWidth={1.6} />
          </View>
          <Text style={styles.deletedTitle}>Record deleted</Text>
          <Text style={styles.deletedText}>
            {debt.person}&apos;s {kindNoun(debt)} and its payment history are gone.
          </Text>
          <PrimaryButton label="Back to People" height={54} onPress={onClose} style={{ alignSelf: 'stretch' }} />
        </View>
      </Sheet>
    </Screen>
  );
}

function Header({ onBack, onDelete }: { onBack: () => void; onDelete?: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={onBack} accessibilityLabel="Back to People" style={({ pressed }) => [styles.iconButton, pressed && { transform: [{ scale: 0.94 }] }]}>
          <Icon name="back" size={18} color={colors.text} strokeWidth={1.9} />
        </Pressable>
        <Text style={styles.title} role="heading">Edit record</Text>
      </View>
      {onDelete && (
        <Pressable
          onPress={onDelete}
          accessibilityLabel="Delete this record"
          style={({ pressed }) => [styles.iconButton, { backgroundColor: 'rgba(255,122,133,0.12)' }, pressed && { transform: [{ scale: 0.94 }] }]}>
          <Icon name="trash" size={18} color={colors.rose} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.pageTitle, color: colors.text },
  body: { paddingTop: 8, paddingHorizontal: 20, paddingBottom: 12, gap: 20 },
  summary: { padding: 16, borderRadius: 22, backgroundColor: colors.surface1, gap: 14 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  summaryName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  summaryText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1C1C21' },
  historyIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.mintTint, alignItems: 'center', justifyContent: 'center' },
  historyText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: '#D9D9DE' },
  historyAmount: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  amountMsg: { marginTop: 10, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textFaint },
  dialogScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.66)' },
  dialogWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', paddingHorizontal: 28 },
  dialog: { padding: 24, borderRadius: 28, backgroundColor: '#18181C', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  binBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,122,133,0.14)', alignItems: 'center', justifyContent: 'center' },
  dialogTitle: { marginTop: 16, fontFamily: fonts.expandedSemibold, fontSize: 20, color: colors.text },
  dialogBody: { marginTop: 8, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  dialogActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  dialogButton: { flex: 1, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  dialogButtonLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  deleted: { alignItems: 'center', gap: 12, paddingTop: 14, paddingHorizontal: 4 },
  deletedTitle: { marginTop: 8, fontFamily: fonts.expandedSemibold, fontSize: 22, color: colors.text },
  deletedText: { marginBottom: 12, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center' },
});
