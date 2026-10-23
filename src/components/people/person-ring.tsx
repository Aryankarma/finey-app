import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts } from '@/ui/theme';

const SIZE = 52;
const R = 24;
const CIRCUMFERENCE = 2 * Math.PI * R;

// Initial in a circle, ringed by how much of the debt has been paid back.
export function PersonRing({
  name,
  paid, // 0 to 1
  color,
  initialColor = colors.text,
  fill = colors.surface2,
  trackColor = colors.surface3,
}: {
  name: string;
  paid: number;
  color: string;
  initialColor?: string;
  fill?: string;
  trackColor?: string;
}) {
  const p = Math.max(0, Math.min(1, paid));
  return (
    <View style={styles.wrap} aria-hidden>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={StyleSheet.absoluteFill}>
        <Circle cx={26} cy={26} r={R} fill="none" stroke={trackColor} strokeWidth={3} />
        {p > 0 && (
          <Circle
            cx={26}
            cy={26}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${(p * CIRCUMFERENCE).toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`}
            transform="rotate(-90 26 26)"
          />
        )}
      </Svg>
      <View style={[styles.initial, { backgroundColor: fill }]}>
        <Text style={[styles.letter, { color: initialColor }]}>{(name.trim()[0] ?? '?').toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE },
  initial: { position: 'absolute', left: 6, top: 6, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: fonts.semibold, fontSize: 15 },
});
