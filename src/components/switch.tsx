import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { useAccent } from '@/hooks/use-accent';
import { colors } from '@/ui/theme';

// The boards' on/off switch. Visual only: put it inside the row that toggles it.
export function SwitchMark({
  on,
  onColor,
  offColor = colors.switchOff,
  knobOffColor = colors.switchKnobOff,
}: {
  on: boolean;
  onColor?: string;
  offColor?: string;
  knobOffColor?: string;
}) {
  const accent = useAccent();
  const t = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: on ? 1 : 0,
      duration: 260,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: false, // animates colours
    }).start();
  }, [on, t]);

  return (
    <Animated.View
      aria-hidden
      style={[styles.track, { backgroundColor: t.interpolate({ inputRange: [0, 1], outputRange: [offColor, onColor ?? accent.iris] }) }]}>
      <Animated.View
        style={[
          styles.knob,
          {
            backgroundColor: t.interpolate({ inputRange: [0, 1], outputRange: [knobOffColor, '#FFFFFF'] }),
            transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: { width: 52, height: 32, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 6 },
  knob: { width: 20, height: 20, borderRadius: 10 },
});
