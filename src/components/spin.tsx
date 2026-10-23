import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Platform } from 'react-native';

// Spins its child while `spinning` is true (refresh icons, the Look up button).
export function Spin({ spinning, children }: { spinning: boolean; children: ReactNode }) {
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spinning) {
      turn.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }));
    loop.start();
    return () => loop.stop();
  }, [spinning, turn]);

  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <Animated.View style={{ transform: [{ rotate }] }}>{children}</Animated.View>;
}
