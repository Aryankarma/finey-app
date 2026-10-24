import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { colors } from '@/ui/theme';

const nativeDriver = Platform.OS !== 'web';

// One dot per digit: hollow until typed, filled after, pink when wrong.
// Bump `shake` (any changing number) to shake the row after a wrong PIN.
export function PinDots({
  count,
  filled,
  wrong = false,
  shake = 0,
  size = 14,
  gap = 16,
}: {
  count: number;
  filled: number;
  wrong?: boolean;
  shake?: number;
  size?: number;
  gap?: number;
}) {
  const x = useRef(new Animated.Value(0)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    x.setValue(0);
    const step = (to: number) => Animated.timing(x, { toValue: to, duration: 42, easing: Easing.linear, useNativeDriver: nativeDriver });
    Animated.sequence([step(-2), step(4), step(-8), step(8), step(-8), step(8), step(-8), step(4), step(-2), step(0)]).start();
  }, [shake, x]);

  return (
    <Animated.View style={[styles.row, { gap, transform: [{ translateX: x }] }]} role="img" aria-label={`${filled} of ${count} digits entered`}>
      {Array.from({ length: count }, (_, i) => {
        const on = i < filled;
        const color = wrong ? colors.rose : colors.lilac;
        return (
          <View
            key={i}
            style={[
              { width: size, height: size, borderRadius: size / 2, borderWidth: size > 12 ? 2 : 1.5, borderColor: '#3A3A42' },
              on && { backgroundColor: color, borderColor: color },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 20 },
});
