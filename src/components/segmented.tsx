import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/ui/theme';

// Pill-shaped segmented control with a sliding thumb.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  background = colors.surface3,
  thumbColor = '#2C2C34',
  textColor = colors.textMuted,
  textOnColor = colors.text,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
  background?: string;
  thumbColor?: string;
  textColor?: string;
  textOnColor?: string;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const x = useRef(new Animated.Value(index)).current;
  const thumb = (width - 8) / options.length;

  useEffect(() => {
    Animated.timing(x, { toValue: index, duration: 300, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [index, x]);

  return (
    <View role="radiogroup" aria-label={label} style={[styles.seg, { backgroundColor: background }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Animated.View style={[styles.thumb, { width: thumb, backgroundColor: thumbColor, transform: [{ translateX: Animated.multiply(x, thumb) }] }]} />
      )}
      {options.map((o) => (
        <Pressable key={o.key} role="radio" aria-checked={value === o.key} onPress={() => onChange(o.key)} style={styles.item}>
          <Text style={[styles.label, { color: textColor }, value === o.key && [styles.labelOn, { color: textOnColor }]]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { height: 48, padding: 4, borderRadius: 24, flexDirection: 'row' },
  thumb: { position: 'absolute', top: 4, left: 4, bottom: 4, borderRadius: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  labelOn: { fontFamily: fonts.semibold, color: colors.text },
});
