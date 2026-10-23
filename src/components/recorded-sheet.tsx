import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { PrimaryButton } from '@/components/primary-button';
import { Sheet } from '@/components/sheet';
import { colors, fonts } from '@/ui/theme';

// "Recorded" confirmation after saving an entry.
export function RecordedSheet({
  visible,
  message,
  onAgain,
  onDone,
}: {
  visible: boolean;
  message: string;
  onAgain: () => void;
  onDone: () => void;
}) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    pop.setValue(0);
    Animated.timing(pop, {
      toValue: 1,
      duration: 500,
      delay: 200,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visible, pop]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <Sheet visible={visible} onClose={onDone}>
      <View style={styles.body} role="status">
        <Animated.View style={{ opacity: pop, transform: [{ scale }] }}>
          <Svg width={76} height={76} viewBox="0 0 76 76">
            <Circle cx={38} cy={38} r={34} fill="none" stroke={colors.mint} strokeWidth={3} />
            <Path d="M25 39l9 9 17-19" fill="none" stroke={colors.mint} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
        <Text style={styles.title}>Recorded</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <Pressable onPress={onAgain} style={({ pressed }) => [styles.again, pressed && { transform: [{ scale: 0.98 }] }]}>
            <Text style={styles.againLabel}>Add another</Text>
          </Pressable>
          <PrimaryButton label="Done" onPress={onDone} height={54} style={{ flex: 1 }} />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: 12, paddingTop: 14, paddingHorizontal: 4 },
  title: { fontFamily: fonts.expandedSemibold, fontSize: 22, color: colors.text, marginTop: 8 },
  message: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  again: { flex: 1, height: 54, borderRadius: 27, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  againLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
});
