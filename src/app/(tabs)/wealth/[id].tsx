import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Amount } from '@/components/amount';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { Sheet } from '@/components/sheet';
import { Spin } from '@/components/spin';
import { dayMonthYear, unitWord } from '@/components/wealth/holding-text';
import type { Holding } from '@/data/seed';
import { useAccent } from '@/hooks/use-accent';
import { easeOutCubic, progress, useEntrance } from '@/hooks/use-entrance';
import { gainOf, isMarketType, returnOf, typeLabels, unitPrice, useHolding, useHoldings } from '@/store/holdings';
import { useToast } from '@/store/toast';
import { formatMoney, groupIndian } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, gradients, layout, space, tabular, type } from '@/ui/theme';

const noOutline = Platform.select<object>({ web: { outlineStyle: 'none' }, default: {} });
const digits = (v: string, max: number) => v.replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, max);
const signedPct = (gain: number, pct: number) => `${formatMoney(gain, { signed: true })} (${Math.abs(pct).toFixed(2)}%)`;

// One holding: value, live price, put in vs worth now, details, edit in place and remove.
export default function HoldingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const live = useHolding(id);
  const router = useRouter();
  // Keep the last version so the "removed" sheet can still name it.
  const last = useRef<Holding | undefined>(undefined);
  if (live) last.current = live;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/wealth'));

  const holding = live ?? last.current;
  if (!holding) {
    return (
      <Screen>
        <Header onBack={back} />
        <Text style={[styles.muted, { padding: space.screenX }]}>This holding no longer exists.</Text>
      </Screen>
    );
  }
  return <HoldingView holding={holding} removed={!live} onBack={back} />;
}

function HoldingView({ holding: h, removed, onBack }: { holding: Holding; removed: boolean; onBack: () => void }) {
  const accent = useAccent();
  const holdings = useHoldings((s) => s.holdings);
  const updateHolding = useHoldings((s) => s.updateHolding);
  const removeHolding = useHoldings((s) => s.removeHolding);
  const showToast = useToast((s) => s.show);
  const elapsed = useEntrance(1100);

  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [refresh, setRefresh] = useState<'idle' | 'busy' | 'fresh'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const market = isMarketType(h.type) && !!h.quantity;
  const price = unitPrice(h);
  const gain = gainOf(h);
  const pct = returnOf(h);
  const total = holdings.reduce((s, x) => s + x.value, 0);
  const others = total - (removed ? 0 : h.value);
  const biggest = Math.max(h.value, h.invested, 1);
  const count = easeOutCubic(progress(elapsed, 100, 900));
  const barIn = (delay: number) => easeOutCubic(progress(elapsed, delay, 900));

  const details: [string, string][] = [
    ...(h.quantity ? ([['Quantity', `${h.quantity} ${unitWord(h, h.quantity)}`]] as [string, string][]) : []),
    ...(h.quantity ? ([['Average buy price', formatMoney(Math.round(h.invested / h.quantity))]] as [string, string][]) : []),
    ...(h.boughtOn ? ([['Bought on', dayMonthYear(h.boughtOn)]] as [string, string][]) : []),
    ['Platform', h.platform],
    ['Share of your portfolio', `${total > 0 ? ((h.value / total) * 100).toFixed(1) : '0.0'}%`],
  ];

  return (
    <Screen>
      <Header onBack={onBack} onEdit={editing ? undefined : () => setEditing(true)} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <View style={styles.tags}>
            {h.ticker && <Text style={[styles.tag, { backgroundColor: `rgba(${accent.rgb},0.18)`, color: accent.lilacSoft }]}>{h.ticker}</Text>}
            <Text style={styles.tag}>{typeLabels[h.type]}</Text>
            <Text style={styles.tag}>{h.platform}</Text>
          </View>
          <Text style={styles.name} role="heading">{h.name}</Text>
          <Amount style={styles.big}>{formatMoney(Math.round(h.value * count))}</Amount>
          <Text style={[styles.muted, { marginTop: 6 }]}>
            <Text style={[styles.strong, { color: gain >= 0 ? colors.mint : colors.rose }]}>{signedPct(gain, pct)}</Text> since you bought
          </Text>
          {market && price !== null && (
            <View style={styles.priceCard}>
              <View style={{ gap: 2 }}>
                <Amount style={styles.price}>{`${formatMoney(price)} a ${unitWord(h, 1)}`}</Amount>
                <Text style={styles.small} role="status">
                  {refresh === 'busy' ? 'Checking the market' : refresh === 'fresh' ? 'Live price, updated just now' : 'Live price, updated 2 min ago'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (refresh === 'busy') return;
                  setRefresh('busy');
                  timer.current = setTimeout(() => setRefresh('fresh'), 1000);
                }}
                accessibilityLabel="Update the price"
                style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.surface3 }, pressed && { transform: [{ scale: 0.94 }] }]}>
                <Spin spinning={refresh === 'busy'}>
                  <Icon name="refresh" size={18} color={colors.text} strokeWidth={1.9} />
                </Spin>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Put in vs worth now</Text>
          <View style={{ gap: 14 }}>
            <View>
              <View style={styles.barHead}>
                <Text style={styles.barLabel}>You put in</Text>
                <Amount style={styles.barValue}>{formatMoney(h.invested)}</Amount>
              </View>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${(h.invested / biggest) * 100 * barIn(100)}%`, backgroundColor: '#4A4A54' }]} />
              </View>
            </View>
            <View>
              <View style={styles.barHead}>
                <Text style={styles.barLabel}>Worth now</Text>
                <Amount style={styles.barValue}>{formatMoney(h.value)}</Amount>
              </View>
              <View style={styles.track}>
                <LinearGradient
                  colors={gradients.gain}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.bar, { width: `${(h.value / biggest) * 100 * barIn(250)}%` }]}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, { paddingBottom: 24 }]}>
          <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Details</Text>
          {editing ? (
            <EditForm
              holding={h}
              market={market}
              price={price}
              onCancel={() => setEditing(false)}
              onSave={(patch) => {
                updateHolding(h.id, patch);
                setEditing(false);
                showToast('Changes saved');
              }}
            />
          ) : (
            <>
              {details.map(([label, value]) => (
                <View key={label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={styles.detailValue}>{value}</Text>
                </View>
              ))}
              <Pressable onPress={() => setConfirming(true)} style={({ pressed }) => [styles.remove, pressed && { transform: [{ scale: 0.97 }] }]}>
                <Icon name="trash" size={16} color={colors.rose} />
                <Text style={styles.removeLabel}>Remove holding</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      <Modal transparent visible={confirming} animationType="fade" onRequestClose={() => setConfirming(false)}>
        <Pressable style={styles.dialogScrim} onPress={() => setConfirming(false)} accessibilityLabel="Cancel" />
        <View style={styles.dialogWrap} pointerEvents="box-none">
          <View style={styles.dialog} role="alertdialog" aria-modal>
            <View style={styles.dialogBadge}>
              <Icon name="trash" size={22} color={colors.rose} />
            </View>
            <Text style={styles.dialogTitle}>Remove {h.name}?</Text>
            <Text style={styles.dialogBody}>It will no longer count in your portfolio totals. You can add it again any time.</Text>
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setConfirming(false)} style={[styles.dialogButton, { backgroundColor: colors.lineStrong }]}>
                <Text style={styles.dialogButtonLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setConfirming(false);
                  removeHolding(h.id);
                }}
                style={[styles.dialogButton, { backgroundColor: colors.danger }]}>
                <Text style={[styles.dialogButtonLabel, { fontFamily: fonts.semibold, color: colors.textOnAccent }]}>Remove</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Sheet visible={removed} onClose={onBack}>
        <View style={styles.removed} role="status">
          <View style={styles.removedBadge}>
            <Icon name="wealth" size={30} color={colors.textMuted} strokeWidth={1.6} />
          </View>
          <Text style={styles.removedTitle}>{h.name} removed</Text>
          <Text style={styles.removedText}>Your portfolio is now worth {formatMoney(others)}.</Text>
          <PrimaryButton label="Back to Wealth" height={54} onPress={onBack} style={{ alignSelf: 'stretch' }} />
        </View>
      </Sheet>
    </Screen>
  );
}

// Edit in place: quantity (or worth today), what you put in, and the platform, with a live preview.
function EditForm({
  holding: h,
  market,
  price,
  onCancel,
  onSave,
}: {
  holding: Holding;
  market: boolean;
  price: number | null;
  onCancel: () => void;
  onSave: (patch: Partial<Holding>) => void;
}) {
  const [qty, setQty] = useState(String(h.quantity ?? ''));
  const [worth, setWorth] = useState(String(h.value));
  const [invested, setInvested] = useState(String(h.invested));
  const [platform, setPlatform] = useState(h.platform);

  const q = parseFloat(qty) || 0;
  const value = market && price !== null ? Math.round(q * price) : parseInt(worth, 10) || 0;
  const inv = parseInt(invested, 10) || 0;
  const cantSave = (market ? !q : !value) || !inv || !platform.trim();
  const gain = value - inv;

  return (
    <View style={styles.edit}>
      <View style={styles.editGrid}>
        {market ? (
          <Field label="Quantity" suffix={unitWord(h)}>
            <TextInput
              value={qty}
              onChangeText={(t) => setQty(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 10))}
              keyboardType="decimal-pad"
              accessibilityLabel="Quantity"
              style={[styles.fieldInput, noOutline]}
            />
          </Field>
        ) : (
          <Field label="Worth today" prefix="₹">
            <TextInput
              value={worth ? groupIndian(parseInt(worth, 10)) : ''}
              onChangeText={(t) => setWorth(digits(t, 9))}
              keyboardType="number-pad"
              accessibilityLabel="Worth today"
              style={[styles.fieldInput, noOutline]}
            />
          </Field>
        )}
        <Field label="You put in" prefix="₹">
          <TextInput
            value={invested ? groupIndian(parseInt(invested, 10)) : ''}
            onChangeText={(t) => setInvested(digits(t, 9))}
            keyboardType="number-pad"
            accessibilityLabel="You put in"
            style={[styles.fieldInput, noOutline]}
          />
        </Field>
      </View>
      <Field label="Platform">
        <TextInput value={platform} onChangeText={setPlatform} accessibilityLabel="Platform" style={[styles.fieldInput, noOutline]} />
      </Field>
      <Text style={[styles.preview, cantSave && { color: colors.rose }]} role="status">
        {cantSave
          ? `Add ${market ? 'a quantity' : 'what it is worth'}, an amount and a platform to save.`
          : `Worth ${formatMoney(value)}, ${gain >= 0 ? 'up' : 'down'} ${formatMoney(Math.abs(gain))} (${Math.abs(inv ? (gain / inv) * 100 : 0).toFixed(2)}%)`}
      </Text>
      <View style={styles.editActions}>
        <Pressable onPress={onCancel} style={[styles.cancel, { flex: 1 }]}>
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
        <PrimaryButton
          label="Save changes"
          height={52}
          disabled={cantSave}
          onPress={() => onSave({ ...(market ? { quantity: q } : {}), value, invested: inv, platform: platform.trim() })}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function Field({ label, prefix, suffix, children }: { label: string; prefix?: string; suffix?: string; children: ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.field}>
        {prefix && <Text style={styles.affix}>{prefix}</Text>}
        {children}
        {suffix && <Text style={styles.affix}>{suffix}</Text>}
      </View>
    </View>
  );
}

function Header({ onBack, onEdit }: { onBack: () => void; onEdit?: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} accessibilityLabel="Back to Wealth" style={({ pressed }) => [styles.iconButton, pressed && { transform: [{ scale: 0.94 }] }]}>
        <Icon name="back" size={18} color={colors.text} strokeWidth={1.9} />
      </Pressable>
      {onEdit && (
        <Pressable onPress={onEdit} style={({ pressed }) => [styles.editButton, pressed && { transform: [{ scale: 0.96 }] }]}>
          <Icon name="edit" size={16} color={colors.text} />
          <Text style={styles.editLabel}>Edit</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
  },
  iconButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: { height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.surface2, flexDirection: 'row', alignItems: 'center', gap: 8 },
  editLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  content: { paddingBottom: 24 },
  top: { paddingTop: 12, paddingHorizontal: space.screenX },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: {
    height: 28,
    lineHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: '#D9D9DE',
  },
  name: { marginTop: 14, ...type.screenTitle, color: colors.text },
  big: { ...type.display, letterSpacing: -0.66, lineHeight: 50, marginTop: 4, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  strong: { fontFamily: fonts.semibold, ...tabular },
  small: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  priceCard: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.surface1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  section: { paddingTop: 24, paddingHorizontal: space.screenX },
  sectionTitle: { ...type.section, color: colors.text, marginBottom: 14 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  barValue: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.surface2 },
  bar: { height: 10, borderRadius: 5 },
  detailRow: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.surface2 },
  detailLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.textFaint },
  detailValue: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, ...tabular },
  remove: {
    marginTop: 18,
    alignSelf: 'flex-start',
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(255,122,133,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.rose },
  edit: { marginTop: 10, gap: 14 },
  editGrid: { flexDirection: 'row', gap: 10 },
  fieldLabel: { marginBottom: 6, fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  field: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  fieldInput: { flex: 1, minWidth: 0, height: '100%', fontFamily: fonts.medium, fontSize: 15, color: colors.text, ...tabular },
  affix: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  preview: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, ...tabular },
  editActions: { flexDirection: 'row', gap: 10 },
  cancel: { height: 52, borderRadius: 26, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  dialogScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.66)' },
  dialogWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', paddingHorizontal: 28 },
  dialog: { padding: 24, borderRadius: 28, backgroundColor: '#18181C', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  dialogBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,122,133,0.14)', alignItems: 'center', justifyContent: 'center' },
  dialogTitle: { marginTop: 16, fontFamily: fonts.expandedSemibold, fontSize: 20, color: colors.text },
  dialogBody: { marginTop: 8, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  dialogActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  dialogButton: { flex: 1, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  dialogButtonLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  removed: { alignItems: 'center', gap: 12, paddingTop: 14, paddingHorizontal: 4 },
  removedBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  removedTitle: { marginTop: 8, fontFamily: fonts.expandedSemibold, fontSize: 22, color: colors.text, textAlign: 'center' },
  removedText: { marginBottom: 12, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center', ...tabular },
});
