import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { useAccent } from '@/hooks/use-accent';
import { useSettings } from '@/store/settings';
import { formatMoney, monthName, shortDay } from '@/ui/format';
import { colors, fonts, tabular } from '@/ui/theme';

const HEIGHT = 170;
const AXIS_WIDTH = 38; // room for the ₹ labels on the right
const TOP_PAD = 12;
const PLOT_HEIGHT = 140;
const TIP_WIDTH = 146;

type Day = { balance: number; income: number; spent: number };

// Gridline spacing: the smallest round step that gives about three lines.
function niceStep(range: number): number {
  const steps = [1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  return steps.find((s) => s >= range / 2.5) ?? steps[steps.length - 1];
}

const axisLabel = (v: number) => (Math.abs(v) >= 100000 ? `₹${v / 100000}L` : `₹${v / 1000}k`);

// Smooth line through the points (Catmull-Rom turned into cubic Béziers).
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

// Running balance for the month so far. Tap anywhere to inspect the nearest day.
export function BalanceChart({
  days,
  month, // ISO date in the month, for labels
  width,
  selected,
  onSelect,
}: {
  days: Day[];
  month: string;
  width: number;
  selected: number; // index into days
  onSelect: (index: number) => void;
}) {
  const accent = useAccent();
  const hidden = useSettings((s) => s.hideAmounts);
  const plotWidth = width - AXIS_WIDTH;
  const balances = days.map((d) => d.balance);
  const min = Math.min(...balances);
  const max = Math.max(...balances);
  const step = niceStep(Math.max(max - min, 1));
  const lo = Math.floor(min / step) * step;
  const top = max + Math.max(max - lo, step) * 0.11;
  const grid: number[] = [];
  for (let v = lo; v <= top; v += step) grid.push(v);

  const xOf = (i: number) => (days.length === 1 ? 0 : (i * plotWidth) / (days.length - 1));
  const yOf = (v: number) => TOP_PAD + ((top - v) / (top - lo)) * PLOT_HEIGHT;
  const points = days.map((d, i) => ({ x: xOf(i), y: yOf(d.balance) }));
  const line = smoothPath(points);
  const last = points[points.length - 1];

  selected = Math.max(0, Math.min(days.length - 1, selected));
  const sel = days[selected];
  const sx = xOf(selected);
  const sy = yOf(sel.balance);
  const dayIso = (i: number) => `${month.slice(0, 8)}${String(i + 1).padStart(2, '0')}`;

  // Day labels: 1 Oct, 7, 14, 21 ... and always the last day, without crowding it.
  const ticks = [0, 6, 13, 20, 27].filter((i) => i < days.length - 3);
  if (!ticks.includes(days.length - 1)) ticks.push(days.length - 1);

  return (
    <View style={{ height: HEIGHT + 18 }}>
      <Svg width={width} height={HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={accent.iris} stopOpacity={0.34} />
            <Stop offset="1" stopColor={accent.iris} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <G stroke="#16161A" strokeWidth={1}>
          {grid.map((v) => (
            <Line key={v} x1={0} y1={yOf(v)} x2={plotWidth} y2={yOf(v)} />
          ))}
        </G>
        {!hidden &&
          grid.map((v) => (
            <SvgText key={v} x={plotWidth + 6} y={yOf(v) + 3.5} fontSize={10} fontFamily={fonts.regular} fill={colors.textFaint}>
              {axisLabel(v)}
            </SvgText>
          ))}
        <Path d={`${line} L${plotWidth},${HEIGHT} L0,${HEIGHT} Z`} fill="url(#area)" />
        <Path d={line} fill="none" stroke={accent.lilac} strokeWidth={2.25} strokeLinecap="round" />
        <Circle cx={last.x} cy={last.y} r={3.5} fill={accent.lilac} />
        <Line x1={sx} y1={0} x2={sx} y2={HEIGHT} stroke={accent.lilac} strokeOpacity={0.5} strokeWidth={1} strokeDasharray="4 4" />
      </Svg>

      <View pointerEvents="none" style={[styles.dot, { left: sx - 6, top: sy - 6 }]} />
      <View pointerEvents="none" style={[styles.tip, { left: sx > plotWidth * 0.54 ? sx - TIP_WIDTH - 10 : sx + 12 }]}>
        <Text style={styles.tipDate}>{shortDay(dayIso(selected))}</Text>
        <Text style={styles.tipBalance}>{hidden ? '₹•••••' : formatMoney(sel.balance)}</Text>
        <Text style={[styles.tipLine, { color: sel.income ? colors.mint : colors.textFaint }]}>
          {sel.income ? `${hidden ? '+₹•••' : formatMoney(sel.income, { signed: true })} in` : 'Nothing came in'}
        </Text>
        <Text style={[styles.tipLine, { color: '#D9D9DE' }]}>{hidden ? '−₹••• out' : `${formatMoney(-sel.spent)} out`}</Text>
      </View>

      <Pressable
        accessibilityLabel={`Running balance. ${shortDay(dayIso(selected))}, ${formatMoney(sel.balance)}. Tap a day to inspect it.`}
        style={[styles.hit, { width: plotWidth + 16 }]}
        onPress={(e) => {
          // react-native-web puts the tap position in offsetX rather than locationX.
          const native = e.nativeEvent as { locationX?: number; offsetX?: number };
          const raw = Number.isFinite(native.locationX) ? native.locationX : native.offsetX;
          if (raw === undefined || !Number.isFinite(raw)) return;
          const index = Math.round(((raw - 8) / plotWidth) * (days.length - 1));
          onSelect(Math.max(0, Math.min(days.length - 1, index)));
        }}
      />

      <View style={[styles.ticks, { width: plotWidth }]}>
        {ticks.map((i) => {
          const label = i === 0 ? `1 ${monthName(month, 'short')}` : String(i + 1);
          const left = i === 0 ? 0 : i === days.length - 1 ? undefined : xOf(i) - 12;
          return (
            <Text key={i} style={[styles.tick, left === undefined ? { right: 0 } : { left, width: i === 0 ? undefined : 24, textAlign: i === 0 ? 'left' : 'center' }]}>
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.bg, borderWidth: 2.5, borderColor: colors.text },
  tip: {
    position: 'absolute',
    top: 0,
    width: TIP_WIDTH,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surface3,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  tipDate: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  tipBalance: { fontFamily: fonts.expandedSemibold, fontSize: 16, color: colors.text, ...tabular },
  tipLine: { fontFamily: fonts.regular, fontSize: 12, ...tabular },
  hit: { position: 'absolute', left: -8, top: 0, height: HEIGHT },
  ticks: { position: 'absolute', left: 0, top: HEIGHT + 2, height: 16 },
  tick: { position: 'absolute', fontFamily: fonts.regular, fontSize: 11, color: colors.textFaint, ...tabular },
});
