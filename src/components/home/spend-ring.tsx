import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { Amount } from '@/components/amount';
import { useAccent } from '@/hooks/use-accent';
import { easeOutCubic, progress } from '@/hooks/use-entrance';
import { formatCompact, formatMoney } from '@/ui/format';
import { colors, fonts, motion } from '@/ui/theme';

// One tick per day of the month around the balance, as on V4-Home.
// Tick length grows with that day's spend; days above the daily average are brighter.
const BOX = 320;
const C = BOX / 2;
const TICK_INNER = 104;
const TICK_MIN = 8;
const TICK_RANGE = 38;
const TICK_FULL_AT = 8000; // spend at which a tick reaches full length
const FUTURE_LENGTH = 5;
const INCOME_DOT_R = 92;
const TICK_STAGGER = 28;

type Props = {
  size: number;
  elapsed: number; // ms since the screen mounted, from useEntrance
  dailySpend: number[]; // days 1 to today
  daysInMonth: number;
  incomeDays: number[];
  balance: number;
  savingsRate: number;
  monthLabel: string;
  current?: boolean; // the month in progress: last tick is today, shown in white and labelled
  caption?: string;
};

function point(day: number, days: number, r: number) {
  const a = ((day - 1) / days) * Math.PI * 2 - Math.PI / 2;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
}

export function SpendRing({
  size,
  elapsed,
  dailySpend,
  daysInMonth,
  incomeDays,
  balance,
  savingsRate,
  monthLabel,
  current = true,
  caption = 'Left this month',
}: Props) {
  const accent = useAccent();
  // low is a dimmed accent (#5B4FC4-ish for Iris on the dark background)
  const tickColors = { low: `rgba(${accent.rgb},0.75)`, high: accent.lilac, today: '#FFFFFF', future: colors.lineStrong };
  const today = dailySpend.length;
  const average = dailySpend.reduce((a, b) => a + b, 0) / today;
  const maxSpend = Math.max(...dailySpend);
  const maxDay = dailySpend.indexOf(maxSpend) + 1;
  const tickDelay = (day: number) => 120 + TICK_STAGGER * (day - 1);

  const ticks = dailySpend.map((spend, i) => {
    const day = i + 1;
    const length = TICK_MIN + TICK_RANGE * Math.min(spend / TICK_FULL_AT, 1);
    const p = easeOutCubic(progress(elapsed, tickDelay(day), 420));
    const inner = point(day, daysInMonth, TICK_INNER);
    const outer = point(day, daysInMonth, TICK_INNER + Math.max(length * p, 0.01));
    const color = current && day === today ? tickColors.today : spend > average ? tickColors.high : tickColors.low;
    return { day, inner, outer, color, opacity: Math.min(p / 0.3, 1), fullOuter: point(day, daysInMonth, TICK_INNER + length) };
  });

  const futureOpacity = progress(elapsed, 100, 500);
  const pillIn = easeOutCubic(progress(elapsed, 1080, 450));
  const count = easeOutCubic(progress(elapsed, 120, motion.countUp));
  const maxTip = ticks[maxDay - 1].fullOuter;
  const todayTip = ticks[today - 1].fullOuter;

  return (
    <View style={{ width: size, height: size }} accessibilityLabel={`${monthLabel} at a glance`}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${BOX} ${BOX}`}
        style={StyleSheet.absoluteFill}
        accessibilityLabel={`Spending for each day of ${monthLabel}. Largest day was ${maxDay} ${monthLabel} at ${formatMoney(maxSpend)}; today ${formatMoney(dailySpend[today - 1])}.`}>
        <Defs>
          <RadialGradient id="glow" cx={C} cy={C} r={120 * Math.SQRT2} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={accent.iris} stopOpacity={0.2} />
            <Stop offset="0.45" stopColor={accent.iris} stopOpacity={0.06} />
            <Stop offset="0.7" stopColor={accent.iris} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={C} cy={C} r={120} fill="url(#glow)" />
        <Circle cx={C} cy={C} r={99} fill="none" stroke={colors.surface3} strokeWidth={1} />

        <G strokeWidth={5} strokeLinecap="round">
          {ticks.map((t) => (
            <Line key={t.day} x1={t.inner.x} y1={t.inner.y} x2={t.outer.x} y2={t.outer.y} stroke={t.color} strokeOpacity={t.opacity} />
          ))}
        </G>
        <G strokeWidth={5} strokeLinecap="round" stroke={tickColors.future} strokeOpacity={futureOpacity}>
          {Array.from({ length: daysInMonth - today }, (_, i) => {
            const day = today + 1 + i;
            const a = point(day, daysInMonth, TICK_INNER);
            const b = point(day, daysInMonth, TICK_INNER + FUTURE_LENGTH);
            return <Line key={day} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
        </G>

        {incomeDays.map((day) => {
          const p = easeOutCubic(progress(elapsed, tickDelay(day) + 200, 360));
          const { x, y } = point(day, daysInMonth, INCOME_DOT_R);
          return <Circle key={day} cx={x} cy={y} r={3.5 * (0.3 + 0.7 * p)} fill={colors.mint} opacity={p} />;
        })}

        {maxSpend > 0 && (
          <SvgText
            x={maxTip.x + 6}
            y={maxTip.y - 4}
            fontSize={11}
            fontFamily={fonts.semibold}
            fill={colors.textMuted}
            opacity={progress(elapsed, tickDelay(maxDay) + 300, 400)}>
            {formatCompact(maxSpend)}
          </SvgText>
        )}
        {current && (
          <SvgText
            x={todayTip.x - 10}
            y={todayTip.y + 14}
            textAnchor="end"
            fontSize={11}
            fontFamily={fonts.semibold}
            fill={colors.text}
            opacity={progress(elapsed, tickDelay(today) + 380, 400)}>
            Today
          </SvgText>
        )}
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text style={styles.caption}>{caption}</Text>
        <Amount style={styles.balance}>{formatMoney(Math.round(balance * count))}</Amount>
        <Text style={[styles.pill, { opacity: pillIn, transform: [{ translateY: 6 * (1 - pillIn) }] }]}>
          {Math.round(savingsRate)}% of income kept
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 6 },
  caption: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  balance: { fontFamily: fonts.expandedSemibold, fontSize: 34, letterSpacing: -0.34, lineHeight: 36, color: colors.text },
  pill: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.mint,
    backgroundColor: colors.mintTint,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
