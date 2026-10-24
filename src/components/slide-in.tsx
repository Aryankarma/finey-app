import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';

import { motion } from '@/ui/theme';

const ease = Easing.bezier(...motion.ease);

// Fades its children in from an offset when it mounts. Give it a new `key` to play it again.
export function SlideIn({ x = 0, y = 0, duration = motion.normal, style, children }: { x?: number; y?: number; duration?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  // With no offset there's nothing to play, so it starts settled.
  const [t] = useState(() => new Animated.Value(x || y ? 0 : 1));
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration, easing: ease, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [t, duration]);
  const shift = (from: number) => t.interpolate({ inputRange: [0, 1], outputRange: [from, 0] });
  return <Animated.View style={[style, { opacity: t, transform: [{ translateX: shift(x) }, { translateY: shift(y) }] }]}>{children}</Animated.View>;
}

// A quick grow-and-settle (scale 1 → 1.07 → 1) each time `active` turns on.
export function Pop({ active, duration = 340, style, children }: { active: boolean; duration?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const [t] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!active) return;
    t.setValue(0);
    Animated.timing(t, { toValue: 1, duration, easing: ease, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [t, active, duration]);
  const scale = t.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.07, 1] });
  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}
