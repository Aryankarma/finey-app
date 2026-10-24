import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Amount } from '@/components/amount';
import { Screen } from '@/components/screen';
import { Spin } from '@/components/spin';
import { holdingCode, holdingMeta } from '@/components/wealth/holding-text';
import { Treemap, type Tile } from '@/components/wealth/treemap';
import type { Holding } from '@/data/seed';
import { useAccent } from '@/hooks/use-accent';
import { returnOf, typeLabels, useHoldings } from '@/store/holdings';
import { formatMoney } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, layout, space, tabular, type } from '@/ui/theme';

type HoldingType = Holding['type'];

export default function WealthScreen() {
  const router = useRouter();
  const accent = useAccent();
  const holdings = useHoldings((s) => s.holdings);
  const [filter, setFilter] = useState<HoldingType | null>(null);
  const [refresh, setRefresh] = useState<'idle' | 'busy' | 'fresh'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const worth = holdings.reduce((s, h) => s + h.value, 0);
  const invested = holdings.reduce((s, h) => s + h.invested, 0);
  const gain = worth - invested;

  // One tile per type, summing its holdings.
  const tiles = useMemo(() => {
    const byType = new Map<HoldingType, { value: number; invested: number; items: Holding[] }>();
    for (const h of holdings) {
      const t = byType.get(h.type) ?? { value: 0, invested: 0, items: [] };
      t.value += h.value;
      t.invested += h.invested;
      t.items.push(h);
      byType.set(h.type, t);
    }
    return [...byType.entries()].map(
      ([key, t]): Tile<HoldingType> => ({
        key,
        label: typeLabels[key],
        short: t.items.length === 1 ? holdingCode(t.items[0]) : typeLabels[key].slice(0, 3),
        value: t.value,
        returnPct: returnOf(t),
      }),
    );
  }, [holdings]);

  const types = tiles.map((t) => t.key);
  const rows = filter ? holdings.filter((h) => h.type === filter) : holdings;
  const pick = (k: HoldingType | null) => setFilter(k === filter ? null : k);

  const updatePrices = () => {
    if (refresh === 'busy') return;
    setRefresh('busy');
    timer.current = setTimeout(() => setRefresh('fresh'), 1200);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title} role="heading">Wealth</Text>
        <Pressable onPress={() => router.push('/wealth/new')} accessibilityLabel="Add a holding" style={({ pressed }) => pressed && { transform: [{ scale: 0.94 }] }}>
          <LinearGradient colors={accent.primary} style={styles.add}>
            <Icon name="plus" size={20} color={colors.textOnAccent} strokeWidth={2.2} />
          </LinearGradient>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.muted}>Worth today</Text>
          <Amount style={styles.big}>{formatMoney(worth)}</Amount>
          {holdings.length > 0 && (
            <>
              <Text style={[styles.muted, { marginTop: 8 }]}>
                <Amount style={[styles.gain, gain < 0 && { color: colors.rose }]}>
                  {`${formatMoney(gain, { signed: true })} (${Math.abs(invested ? (gain / invested) * 100 : 0).toFixed(2)}%)`}
                </Amount>{' '}
                on <Amount style={tabular}>{formatMoney(invested)}</Amount> invested
              </Text>
              <Pressable onPress={updatePrices} accessibilityLabel="Update market prices" style={styles.refresh}>
                <Spin spinning={refresh === 'busy'}>
                  <Icon name="refresh" size={13} color={colors.textFaint} strokeWidth={2} />
                </Spin>
                <Text style={styles.refreshText} role="status">
                  {refresh === 'busy' ? 'Updating market prices' : refresh === 'fresh' ? 'Market prices updated just now' : 'Market prices updated a moment ago'}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {holdings.length > 0 ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Where it sits</Text>
                <Text style={styles.sectionHint}>Greener tiles have grown more</Text>
              </View>
              <Treemap tiles={tiles} selected={filter} onSelect={pick} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroller} contentContainerStyle={styles.chips} role="radiogroup" aria-label="Filter holdings">
              <Chip label="All" on={filter === null} onPress={() => setFilter(null)} />
              {types.map((t) => (
                <Chip key={t} label={typeLabels[t]} on={filter === t} onPress={() => pick(t)} />
              ))}
            </ScrollView>

            <View style={styles.list} aria-live="polite">
              {rows.map((h) => {
                const r = returnOf(h);
                return (
                  <Pressable
                    key={h.id}
                    onPress={() => router.push({ pathname: '/wealth/[id]', params: { id: h.id } })}
                    style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#0F0F12' }]}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{holdingCode(h)}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Text style={styles.name} numberOfLines={1}>{h.name}</Text>
                      <Text style={styles.meta} numberOfLines={1}>{holdingMeta(h)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Amount style={styles.value}>{formatMoney(h.value)}</Amount>
                      <Text style={[styles.roi, r < 0 && { color: colors.rose }]}>
                        {r >= 0 ? '+' : '−'}
                        {Math.abs(r).toFixed(2)}%
                      </Text>
                    </View>
                    <Icon name="chevronRight" size={16} color={colors.textDisabled} strokeWidth={2} />
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="wealth" size={24} color={colors.mint} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>Add your stocks, funds, deposits and gold with the + button to see them grow.</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} role="radio" aria-checked={on} style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && { transform: [{ scale: 0.96 }] }]}>
      <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{label}</Text>
    </Pressable>
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
  content: { paddingBottom: 32 },
  hero: { paddingTop: 16, paddingHorizontal: space.screenX },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  big: { fontFamily: fonts.expandedSemibold, fontSize: 42, letterSpacing: -0.63, lineHeight: 48, marginTop: 2, color: colors.text },
  gain: { fontFamily: fonts.semibold, color: colors.mint, ...tabular },
  refresh: { marginTop: 6, height: 32, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  refreshText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  section: { paddingTop: 16, paddingHorizontal: space.screenX },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { ...type.section, color: colors.text },
  sectionHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  chipScroller: { flexGrow: 0, marginTop: 18 },
  chips: { gap: 8, paddingHorizontal: space.screenX },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surface2, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.text },
  chipLabel: { fontFamily: fonts.medium, fontSize: 13, color: '#D9D9DE' },
  chipLabelOn: { fontFamily: fonts.semibold, color: colors.bg },
  list: { paddingTop: 8, paddingHorizontal: space.screenX },
  row: { height: 60, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 12 },
  badge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12, color: '#D9D9DE' },
  name: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  value: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  roi: { fontFamily: fonts.regular, fontSize: 12, color: colors.mint, ...tabular },
  empty: { paddingTop: 48, paddingHorizontal: 32, alignItems: 'center', gap: 10 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.mintTint, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 6, fontFamily: fonts.expandedSemibold, fontSize: 17, color: colors.text },
  emptyBody: { maxWidth: 280, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center' },
});
