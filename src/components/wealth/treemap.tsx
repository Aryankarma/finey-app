import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Amount } from '@/components/amount';
import { formatCompact, formatMoney } from '@/ui/format';
import { fonts, tabular } from '@/ui/theme';

const GAP = 4;

export type Tile<K extends string> = { key: K; label: string; short: string; value: number; returnPct: number };
type Rect = { x: number; y: number; w: number; h: number };

// Split the items into two halves of roughly equal value, side by side when the space is wide,
// stacked when it's squarish or tall, and recurse. Items must be sorted biggest first.
function layout<K extends string>(items: Tile<K>[], r: Rect): { tile: Tile<K>; rect: Rect }[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ tile: items[0], rect: r }];
  const total = items.reduce((s, t) => s + t.value, 0);
  let split = 1;
  let bestDiff = Infinity;
  let acc = 0;
  for (let i = 1; i < items.length; i++) {
    acc += items[i - 1].value;
    const diff = Math.abs(acc - total / 2);
    if (diff < bestDiff) {
      bestDiff = diff;
      split = i;
    }
  }
  const a = items.slice(0, split);
  const b = items.slice(split);
  const frac = a.reduce((s, t) => s + t.value, 0) / total;
  if (r.w / r.h > 1.2) {
    const w = (r.w - GAP) * frac;
    return [...layout(a, { ...r, w }), ...layout(b, { x: r.x + w + GAP, y: r.y, w: r.w - w - GAP, h: r.h })];
  }
  const h = (r.h - GAP) * frac;
  return [...layout(a, { ...r, h }), ...layout(b, { x: r.x, y: r.y + h + GAP, w: r.w, h: r.h - h - GAP })];
}

// Tile shade follows the return: greener (or redder, for a loss) the more it has moved.
function shade(returnPct: number) {
  const a = Math.min(0.5, Math.max(0.08, 0.06 + Math.abs(returnPct) / 100));
  return returnPct >= 0 ? `rgba(94,224,161,${a.toFixed(2)})` : `rgba(255,122,133,${a.toFixed(2)})`;
}

const pct = (n: number, digits = 1) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(digits)}%`;

// Holdings as tiles sized by value. Tap a tile to filter; tap it again to clear.
export function Treemap<K extends string>({
  tiles,
  selected,
  onSelect,
  height = 216,
}: {
  tiles: Tile<K>[];
  selected: K | null;
  onSelect: (key: K) => void;
  height?: number;
}) {
  const [width, setWidth] = useState(0);
  const sorted = [...tiles].filter((t) => t.value > 0).sort((a, b) => b.value - a.value);
  const placed = width > 0 ? layout(sorted, { x: 0, y: 0, w: width, h: height }) : [];

  return (
    <View
      style={{ height }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      role="group"
      aria-label="Holdings sized by value and shaded by return; tap one to filter">
      {placed.map(({ tile, rect }) => {
        const on = selected === tile.key;
        const dim = selected !== null && !on;
        // Too narrow or too short for label + value: show the short code and return only.
        const tiny = rect.w < 56 || rect.h < 72;
        const wide = rect.w >= 150;
        const subColor = tile.returnPct >= 0 ? '#DDF7EA' : '#FFD9DC';
        return (
          <Pressable
            key={tile.key}
            onPress={() => onSelect(tile.key)}
            aria-pressed={on}
            accessibilityLabel={`${tile.label}, ${formatMoney(tile.value)}, ${tile.returnPct >= 0 ? 'up' : 'down'} ${Math.abs(tile.returnPct).toFixed(1)} percent`}
            style={({ pressed }) => [
              styles.tile,
              { left: rect.x, top: rect.y, width: rect.w, height: rect.h, backgroundColor: shade(tile.returnPct) },
              tiny && styles.tiny,
              dim && { opacity: 0.28 },
              on && styles.selected,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}>
            {tiny ? (
              <>
                <Text style={[styles.label, { fontSize: 11 }]} numberOfLines={1}>{tile.short}</Text>
                <Text style={[styles.sub, { fontSize: 10, color: subColor }]}>{pct(tile.returnPct, 0)}</Text>
              </>
            ) : (
              <>
                <Text style={styles.label} numberOfLines={1}>{tile.label}</Text>
                <View style={wide ? styles.rowBottom : styles.colBottom}>
                  <Amount style={[styles.value, { fontSize: wide ? 16 : rect.w >= 110 ? 15 : 13 }]}>
                    {rect.w >= 110 ? formatMoney(tile.value) : formatCompact(tile.value)}
                  </Amount>
                  <Text style={[styles.sub, { color: subColor }]}>{pct(tile.returnPct)}</Text>
                </View>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { position: 'absolute', borderRadius: 14, padding: 12, justifyContent: 'space-between' },
  tiny: { paddingHorizontal: 0, paddingVertical: 10, alignItems: 'center' },
  selected: { borderWidth: 2, borderColor: '#F4F4F6', padding: 10 },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: '#F4F4F6' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  colBottom: { gap: 2 },
  value: { fontFamily: fonts.expandedSemibold, color: '#F4F4F6' },
  sub: { fontFamily: fonts.regular, fontSize: 12, ...tabular },
});
