import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { DatePickerSheet } from '@/components/date-picker-sheet';
import { FormHeader, formStyles } from '@/components/entry-form';
import { Chip, ChipRow, FieldLabel } from '@/components/people/debt-form';
import { PrimaryButton } from '@/components/primary-button';
import { ResultSheet } from '@/components/result-sheet';
import { Screen } from '@/components/screen';
import { Spin } from '@/components/spin';
import { unitWord } from '@/components/wealth/holding-text';
import type { Holding } from '@/data/seed';
import { useAccent } from '@/hooks/use-accent';
import { currentDay } from '@/store/entries';
import { isMarketType, lookUpTicker, typeLabels, useHoldings } from '@/store/holdings';
import { formatMoney, groupIndian, longDay } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, tabular } from '@/ui/theme';

type HoldingType = Holding['type'];
type Lookup = 'idle' | 'loading' | 'found' | 'notfound';

const TYPES = Object.keys(typeLabels) as HoldingType[];
const noOutline = Platform.select<object>({ web: { outlineStyle: 'none' }, default: {} });
const digits = (v: string, max: number) => v.replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, max);
const namePlaceholder: Partial<Record<HoldingType, string>> = { fd: 'SBI FD, 1 year', gold: 'Gold coins', funds: 'Nifty 50 index fund' };

// New holding: stocks and crypto look up a live price by ticker; everything else takes a name and value.
export default function NewHoldingScreen() {
  const router = useRouter();
  const accent = useAccent();
  const addHolding = useHoldings((s) => s.addHolding);
  const today = currentDay();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/wealth'));

  const [kind, setKind] = useState<HoldingType>('stocks');
  const [ticker, setTicker] = useState('');
  const [lookup, setLookup] = useState<Lookup>('idle');
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [worthDigits, setWorthDigits] = useState('');
  const [investedDigits, setInvestedDigits] = useState('');
  const [platform, setPlatform] = useState('');
  const [boughtOn, setBoughtOn] = useState(today);
  const [dateOpen, setDateOpen] = useState(false);
  const [added, setAdded] = useState<Holding | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const market = isMarketType(kind);
  const tk = ticker.trim().toUpperCase();
  const hit = market && lookup === 'found' ? lookUpTicker(kind, tk) : null;
  const q = parseFloat(qty) || 0;
  const invested = parseInt(investedDigits, 10) || 0;
  const needValue = !market || lookup === 'notfound';
  const worth = hit ? Math.round(hit.price * q) : needValue ? parseInt(worthDigits, 10) || 0 : 0;
  const gain = worth - invested;
  const unit = unitWord({ type: kind });

  const hint = market
    ? !tk
      ? 'Add a ticker to continue.'
      : !q
        ? 'Add how many you hold.'
        : !hit && !(lookup === 'notfound' && worth)
          ? lookup === 'notfound'
            ? 'Enter what it is worth today.'
            : 'Look up the price, or enter the value yourself.'
          : !invested
            ? 'Add how much you put in.'
            : ''
    : !name.trim()
      ? 'Add a name to continue.'
      : !worth
        ? 'Enter what it is worth today.'
        : !invested
          ? 'Add how much you put in.'
          : '';

  const pickType = (t: HoldingType) => {
    if (t === kind) return;
    setKind(t);
    setLookup('idle');
    setTicker('');
    setQty('');
  };

  const lookUp = () => {
    if (!tk || lookup === 'loading') return;
    setLookup('loading');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLookup(lookUpTicker(kind, tk) ? 'found' : 'notfound'), 900);
  };

  const reset = () => {
    setTicker('');
    setLookup('idle');
    setName('');
    setQty('');
    setWorthDigits('');
    setInvestedDigits('');
    setPlatform('');
    setBoughtOn(today);
  };

  const save = () => {
    if (hint) return;
    const holding = addHolding({
      name: market ? (hit?.name ?? tk) : name.trim(),
      type: kind,
      ...(market ? { ticker: tk, quantity: q } : {}),
      platform: platform.trim() || 'Not set',
      invested,
      value: worth,
      boughtOn,
    });
    setAdded(holding);
  };

  return (
    <Screen bottom>
      <FormHeader title="New holding" onClose={close} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View>
          <FieldLabel>Type</FieldLabel>
          <ChipRow>
            {TYPES.map((t) => (
              <Chip key={t} label={typeLabels[t]} on={kind === t} onPress={() => pickType(t)} />
            ))}
          </ChipRow>
        </View>

        {market ? (
          <View>
            <FieldLabel>{kind === 'crypto' ? 'Coin' : 'Ticker'}</FieldLabel>
            <View style={[styles.field, { paddingRight: 6 }]}>
              <TextInput
                value={ticker}
                onChangeText={(t) => {
                  setTicker(t.toUpperCase().replace(/[^A-Z0-9.&-]/g, '').slice(0, 12));
                  setLookup('idle');
                }}
                onSubmitEditing={lookUp}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder={kind === 'crypto' ? 'BTC' : 'TCS, INFY'}
                placeholderTextColor={colors.textFaint}
                accessibilityLabel={kind === 'crypto' ? 'Coin' : 'Ticker'}
                style={[styles.input, { letterSpacing: 0.6 }, noOutline]}
              />
              <Pressable onPress={lookUp} disabled={!tk || lookup === 'loading'} style={({ pressed }) => [styles.look, (!tk || lookup === 'loading') && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.96 }] }]}>
                {lookup === 'loading' ? (
                  <Spin spinning>
                    <Icon name="spinner" size={16} color={accent.lilacSoft} strokeWidth={2.2} />
                  </Spin>
                ) : (
                  <Icon name="search" size={16} color={accent.lilacSoft} strokeWidth={2} />
                )}
                <Text style={[styles.lookLabel, { color: accent.lilacSoft }]}>Look up</Text>
              </Pressable>
            </View>
            <View style={styles.status} role="status">
              {lookup === 'idle' && <Text style={styles.statusText}>Look it up to fill in today&apos;s price.</Text>}
              {lookup === 'loading' && <Text style={[styles.statusText, { color: colors.textMuted }]}>Checking the market</Text>}
              {lookup === 'found' && hit && (
                <View style={styles.found}>
                  <View style={{ gap: 2, flexShrink: 1, minWidth: 0 }}>
                    <Text style={styles.foundName} numberOfLines={1}>{hit.name}</Text>
                    <View style={styles.liveRow}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>Live price</Text>
                    </View>
                  </View>
                  <Text style={styles.foundPrice}>{`${formatMoney(hit.price)} a ${unitWord({ type: kind }, 1)}`}</Text>
                </View>
              )}
              {lookup === 'notfound' && (
                <Text style={[styles.statusText, { color: colors.rose, lineHeight: 19 }]}>
                  We couldn&apos;t find {tk}. Check it, or enter what it is worth today below.
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View>
            <FieldLabel>Name</FieldLabel>
            <View style={styles.field}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={namePlaceholder[kind] ?? 'What is it?'}
                placeholderTextColor={colors.textFaint}
                accessibilityLabel="Name"
                style={[styles.input, noOutline]}
              />
            </View>
          </View>
        )}

        <View style={styles.grid}>
          {market && (
            <Field label="Quantity" suffix={unit}>
              <TextInput
                value={qty}
                onChangeText={(t) => setQty(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 10))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textFaint}
                accessibilityLabel="Quantity"
                style={[styles.input, tabular, noOutline]}
              />
            </Field>
          )}
          {needValue && (
            <Field label="Worth today" prefix="₹">
              <TextInput
                value={worthDigits ? groupIndian(parseInt(worthDigits, 10)) : ''}
                onChangeText={(t) => setWorthDigits(digits(t, 9))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textFaint}
                accessibilityLabel="Worth today"
                style={[styles.input, tabular, noOutline]}
              />
            </Field>
          )}
          <Field label="You put in" prefix="₹">
            <TextInput
              value={investedDigits ? groupIndian(parseInt(investedDigits, 10)) : ''}
              onChangeText={(t) => setInvestedDigits(digits(t, 9))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textFaint}
              accessibilityLabel="You put in"
              style={[styles.input, tabular, noOutline]}
            />
          </Field>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Icon name="building" size={18} color={colors.textFaint} />
            <TextInput
              value={platform}
              onChangeText={setPlatform}
              placeholder="Where you hold it"
              placeholderTextColor={colors.textFaint}
              accessibilityLabel="Platform"
              style={[styles.input, noOutline]}
            />
            <Text style={styles.cardHint}>Platform</Text>
          </View>
          <Pressable onPress={() => setDateOpen(true)} style={({ pressed }) => [styles.cardRow, styles.cardDivider, pressed && { backgroundColor: colors.surface2 }]}>
            <Icon name="calendar" size={18} color={colors.textFaint} />
            <Text style={styles.cardText}>{longDay(boughtOn, today).replace(/^(Today|Yesterday), /, '')}</Text>
            <Text style={styles.cardHint}>Bought on</Text>
            <Icon name="chevronRight" size={16} color={colors.textFaint} strokeWidth={2} />
          </Pressable>
        </View>

        {worth > 0 && invested > 0 && (
          <View style={styles.gain} aria-live="polite">
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
              <Defs>
                <RadialGradient id="gainGlow" cx="100%" cy="0%" rx="120%" ry="140%" fx="100%" fy="0%">
                  <Stop offset="0" stopColor={gain >= 0 ? colors.mint : colors.rose} stopOpacity={0.16} />
                  <Stop offset="0.6" stopColor={gain >= 0 ? colors.mint : colors.rose} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#gainGlow)" />
            </Svg>
            <View style={{ gap: 4 }}>
              <Text style={styles.gainLabel}>Worth now</Text>
              <Text style={styles.gainWorth}>{formatMoney(worth)}</Text>
            </View>
            <Text style={[styles.gainText, { color: gain >= 0 ? colors.mint : colors.rose }]}>
              {gain >= 0 ? "You're up " : "You're down "}
              {formatMoney(Math.abs(gain))} ({Math.abs((gain / invested) * 100).toFixed(2)}%)
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[formStyles.footer, { paddingTop: 8 }]}>
        {hint !== '' && <Text style={formStyles.hint} role="status">{hint}</Text>}
        <PrimaryButton label="Add holding" disabled={hint !== ''} onPress={save} />
      </View>

      <DatePickerSheet
        visible={dateOpen}
        value={boughtOn}
        today={today}
        onClose={() => setDateOpen(false)}
        onPick={(d) => {
          setBoughtOn(d);
          setDateOpen(false);
        }}
      />
      <ResultSheet
        visible={added !== null}
        title="Holding added"
        message={
          added
            ? added.quantity
              ? `${added.ticker ?? added.name}, ${added.quantity} ${unitWord(added, added.quantity)} worth ${formatMoney(added.value)}, is now part of your portfolio.`
              : `${added.name}, worth ${formatMoney(added.value)}, is now part of your portfolio.`
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

function Field({ label, prefix, suffix, children }: { label: string; prefix?: string; suffix?: string; children: ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.field}>
        {prefix && <Text style={styles.affix}>{prefix}</Text>}
        {children}
        {suffix && <Text style={[styles.affix, { paddingRight: 10 }]}>{suffix}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 8, paddingHorizontal: 20, paddingBottom: 12, gap: 20 },
  field: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 16,
  },
  input: { flex: 1, minWidth: 0, height: '100%', fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  affix: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  look: { height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.surface4, flexDirection: 'row', alignItems: 'center', gap: 6 },
  lookLabel: { fontFamily: fonts.semibold, fontSize: 14 },
  status: { minHeight: 22, marginTop: 10 },
  statusText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  found: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(94,224,161,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(94,224,161,0.18)',
  },
  foundName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint },
  liveText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  foundPrice: { fontFamily: fonts.expandedSemibold, fontSize: 16, color: colors.text, ...tabular },
  grid: { flexDirection: 'row', gap: 10 },
  card: { borderRadius: 18, backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  cardRow: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  cardDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  cardText: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  cardHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  gain: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.surface1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  gainLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  gainWorth: { fontFamily: fonts.expandedSemibold, fontSize: 24, color: colors.text, ...tabular },
  gainText: { flexShrink: 1, textAlign: 'right', fontFamily: fonts.semibold, fontSize: 14, ...tabular },
});
