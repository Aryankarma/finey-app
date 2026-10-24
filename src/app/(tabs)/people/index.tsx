import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Amount } from '@/components/amount';
import { actionLabel, describe, historyLine, statusLine, theyOwe } from '@/components/people/debt-text';
import { PaymentSheet } from '@/components/people/payment-sheet';
import { PersonRing } from '@/components/people/person-ring';
import { Screen } from '@/components/screen';
import type { Debt } from '@/data/seed';
import { useAccent } from '@/hooks/use-accent';
import { isSettled, paidSoFar, remaining, useDebts } from '@/store/debts';
import { formatMoney } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, layout, space, tabular, type } from '@/ui/theme';

type Tab = 'open' | 'settled' | 'all';
const TABS: { key: Tab; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'settled', label: 'Settled' },
  { key: 'all', label: 'All' },
];
const TAB_WIDTH = 88;

export default function PeopleScreen() {
  const router = useRouter();
  const accent = useAccent();
  const debts = useDebts((s) => s.debts);
  const [tab, setTab] = useState<Tab>('open');
  const [paying, setPaying] = useState<string | null>(null);

  const open = useMemo(() => debts.filter((d) => !isSettled(d)), [debts]);
  const owed = open.filter(theyOwe).reduce((s, d) => s + remaining(d), 0);
  const owe = open.filter((d) => !theyOwe(d)).reduce((s, d) => s + remaining(d), 0);
  const biggest = Math.max(owed, owe, 1);
  const net = owed - owe;
  const openGroups = useMemo(() => groupByPerson(open), [open]);
  const groups = useMemo(
    () => (tab === 'open' ? openGroups : groupByPerson(tab === 'settled' ? debts.filter(isSettled) : debts)),
    [tab, openGroups, debts],
  );
  const [expanded, setExpanded] = useState<string | null>(() => openGroups[0]?.key ?? null);

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title} role="heading">People</Text>
        <Pressable onPress={() => router.push('/people/new')} accessibilityLabel="Add money you lent or borrowed" style={({ pressed }) => pressed && { transform: [{ scale: 0.94 }] }}>
          <LinearGradient colors={accent.primary} style={styles.add}>
            <Icon name="plus" size={20} color={colors.textOnAccent} strokeWidth={2.2} />
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <View style={{ gap: 3 }}>
            <Text style={styles.summaryLabel}>You owe</Text>
            <Amount style={styles.summaryValue}>{formatMoney(owe)}</Amount>
          </View>
          <View style={{ gap: 3, alignItems: 'flex-end' }}>
            <Text style={styles.summaryLabel}>Owed to you</Text>
            <Amount style={[styles.summaryValue, { color: colors.mint }]}>{formatMoney(owed)}</Amount>
          </View>
        </View>
        <View style={styles.balance} role="img" aria-label={`You owe ${formatMoney(owe)} and are owed ${formatMoney(owed)}`}>
          <View style={[styles.owe, { width: `${(owe / biggest) * 50}%`, backgroundColor: accent.iris }]} />
          <View style={[styles.owed, { width: `${(owed / biggest) * 50}%` }]} />
          <View style={styles.middle} />
        </View>
        <Text style={styles.net}>
          {open.length === 0 ? (
            'Nobody owes anything right now.'
          ) : net === 0 ? (
            "You'll be even once everyone settles up."
          ) : (
            <>
              You&apos;ll be <Text style={styles.netStrong}>{formatMoney(Math.abs(net))}</Text> {net > 0 ? 'ahead' : 'behind'} once everyone settles up.
            </>
          )}
        </Text>
      </View>

      <StatusTabs value={tab} onChange={setTab} openCount={openGroups.length} />

      <ScrollView contentContainerStyle={styles.list}>
        {groups.map((g, i) => (
          <PersonRow
            key={g.key}
            group={g}
            first={i === 0}
            expanded={expanded === g.key}
            onToggle={() => setExpanded(expanded === g.key ? null : g.key)}
            onPay={setPaying}
            onEdit={(id) => router.push({ pathname: '/people/[id]/edit', params: { id } })}
          />
        ))}
        {groups.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name={tab === 'settled' ? 'check' : 'people'} size={24} color={colors.mint} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>{tab === 'settled' ? 'Nothing settled yet' : 'Nobody owes anything'}</Text>
            <Text style={styles.emptyBody}>
              {tab === 'settled'
                ? 'When someone pays you back in full, or you clear what you owe, it moves here.'
                : 'Add money you lent or borrowed with the + button.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <PaymentSheet debtId={paying} onClose={() => setPaying(null)} />
    </Screen>
  );
}

function StatusTabs({ value, onChange, openCount }: { value: Tab; onChange: (t: Tab) => void; openCount: number }) {
  const accent = useAccent();
  const index = TABS.findIndex((t) => t.key === value);
  const x = useRef(new Animated.Value(index * TAB_WIDTH)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: index * TAB_WIDTH, duration: 280, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [index, x]);

  return (
    <View style={styles.tabs} role="tablist" aria-label="Status">
      {TABS.map((t) => (
        <Pressable key={t.key} role="tab" aria-selected={value === t.key} onPress={() => onChange(t.key)} style={styles.tab}>
          <Text style={[styles.tabLabel, value === t.key && { color: colors.text }]}>{t.label}</Text>
          {t.key === 'open' && openCount > 0 && <Text style={[styles.tabLabel, tabular]}>{openCount}</Text>}
        </Pressable>
      ))}
      <Animated.View style={[styles.indicator, { backgroundColor: accent.iris, transform: [{ translateX: x }] }]} />
    </View>
  );
}

type PersonGroup = { key: string; name: string; debts: Debt[] };

// One row per person (names match ignoring case), in the order they first appear.
function groupByPerson(list: Debt[]): PersonGroup[] {
  const groups = new Map<string, PersonGroup>();
  for (const d of list) {
    const key = d.person.trim().toLowerCase();
    const g = groups.get(key);
    if (g) g.debts.push(d);
    else groups.set(key, { key, name: d.person.trim(), debts: [d] });
  }
  return [...groups.values()];
}

const signedLeft = (d: Debt) => (theyOwe(d) ? remaining(d) : -remaining(d));

function PersonRow({
  group,
  first,
  expanded,
  onToggle,
  onPay,
  onEdit,
}: {
  group: PersonGroup;
  first: boolean;
  expanded: boolean;
  onToggle: () => void;
  onPay: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const accent = useAccent();
  const single = group.debts.length === 1 ? group.debts[0] : null;
  const total = group.debts.reduce((s, d) => s + d.amount, 0);
  const paid = group.debts.reduce((s, d) => s + paidSoFar(d), 0);
  const net = group.debts.reduce((s, d) => s + signedLeft(d), 0);
  const settled = group.debts.every(isSettled);
  const owesYou = single ? theyOwe(single) : net >= 0;

  const amountText = settled ? formatMoney(total) : formatMoney(net, { signed: true });
  const subText = single
    ? statusLine(single)
    : settled
      ? 'settled up'
      : net > 0
        ? 'owes you overall'
        : net < 0
          ? 'you owe overall'
          : 'evens out';

  return (
    <View style={!first && styles.rowDivider}>
      <Pressable onPress={onToggle} aria-expanded={expanded} style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#0F0F12' }]}>
        <PersonRing
          name={group.name}
          paid={paid / total}
          color={owesYou ? colors.mint : accent.iris}
          initialColor={owesYou ? colors.text : accent.lilacSoft}
        />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Text style={styles.name}>{group.name}</Text>
          <Text style={styles.desc} numberOfLines={1}>
            {single ? describe(single) : `${group.debts.length} records`}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Amount style={[styles.amount, settled || net === 0 ? { color: colors.textFaint } : net > 0 && { color: colors.mint }]}>{amountText}</Amount>
          <Text style={styles.sub}>{subText}</Text>
        </View>
        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <Icon name="chevronDown" size={16} color={colors.textDisabled} strokeWidth={2} />
        </View>
      </Pressable>
      {expanded && (
        <View style={styles.panel}>
          {single ? (
            <DebtActions debt={single} onPay={onPay} onEdit={onEdit} />
          ) : (
            group.debts.map((d, i) => (
              <View key={d.id} style={[styles.record, i > 0 && styles.recordDivider]}>
                <View style={styles.historyRow}>
                  <Text style={styles.recordTitle} numberOfLines={1}>{describe(d)}</Text>
                  <Amount style={[styles.recordAmount, isSettled(d) ? { color: colors.textFaint } : theyOwe(d) && { color: colors.mint }]}>
                    {isSettled(d) ? 'settled' : formatMoney(signedLeft(d), { signed: true })}
                  </Amount>
                </View>
                <DebtActions debt={d} onPay={onPay} onEdit={onEdit} />
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

// A record's payment history line with its Record payment and Edit buttons.
function DebtActions({ debt, onPay, onEdit }: { debt: Debt; onPay: (id: string) => void; onEdit: (id: string) => void }) {
  const accent = useAccent();
  const history = historyLine(debt);
  return (
    <>
      <View style={styles.historyRow}>
        <Text style={styles.history}>{history.text}</Text>
        {history.amount !== undefined && <Amount style={styles.historyAmount}>{formatMoney(history.amount)}</Amount>}
      </View>
      <View style={styles.pills}>
        {!isSettled(debt) && (
          <Pressable onPress={() => onPay(debt.id)} style={({ pressed }) => pressed && { transform: [{ scale: 0.96 }] }}>
            <LinearGradient colors={accent.primary} style={styles.pill}>
              <Text style={styles.pillLabel}>{actionLabel(debt)}</Text>
            </LinearGradient>
          </Pressable>
        )}
        <Pressable onPress={() => onEdit(debt.id)} style={({ pressed }) => [styles.pill, styles.pillPlain, pressed && { transform: [{ scale: 0.96 }] }]}>
          <Text style={[styles.pillLabel, { fontFamily: fonts.medium }]}>Edit</Text>
        </Pressable>
      </View>
    </>
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
  title: { ...type.screenTitle, color: colors.text },
  add: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  summary: { paddingTop: 18, paddingHorizontal: space.screenX },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  summaryLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  summaryValue: { fontFamily: fonts.expandedSemibold, fontSize: 22, color: colors.text },
  balance: { height: 8, marginTop: 14, borderRadius: 4, backgroundColor: colors.surface2 },
  owe: { position: 'absolute', right: '50%', top: 0, bottom: 0, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  owed: { position: 'absolute', left: '50%', top: 0, bottom: 0, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: colors.mint },
  middle: { position: 'absolute', left: '50%', top: -4, width: 2, height: 16, marginLeft: -1, borderRadius: 1, backgroundColor: colors.text },
  net: { marginTop: 12, fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  netStrong: { fontFamily: fonts.semibold, color: colors.text, ...tabular },
  tabs: { flexDirection: 'row', marginTop: 18, paddingHorizontal: space.screenX, borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { width: TAB_WIDTH, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.textFaint },
  indicator: { position: 'absolute', left: space.screenX, bottom: -1, width: TAB_WIDTH, height: 2, borderRadius: 2 },
  list: { paddingTop: 4, paddingHorizontal: space.screenX, paddingBottom: 96 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.surface2 },
  row: { height: 72, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  desc: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  amount: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, ...tabular },
  panel: { paddingLeft: 66, paddingBottom: 16, gap: 12 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  record: { gap: 10 },
  recordDivider: { paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.surface2 },
  recordTitle: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  recordAmount: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  history: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  historyAmount: { fontFamily: fonts.regular, fontSize: 13, color: colors.text },
  pills: { flexDirection: 'row', gap: 8 },
  pill: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  pillPlain: { backgroundColor: colors.surface2, borderTopWidth: 0 },
  pillLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textOnAccent },
  empty: { paddingTop: 48, paddingHorizontal: 12, alignItems: 'center', gap: 10 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.mintTint, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 6, fontFamily: fonts.expandedSemibold, fontSize: 17, color: colors.text },
  emptyBody: { maxWidth: 280, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center' },
});
