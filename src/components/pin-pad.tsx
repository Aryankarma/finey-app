import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/ui/icons';
import { colors, fonts, tabular } from '@/ui/theme';

// Number pad for PIN entry. The bottom-left key is optional (the fingerprint key on the lock sheet).
export function PinPad({
  onDigit,
  onBackspace,
  disabled = false,
  extraKey,
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
  extraKey?: { label: string; icon: ReactNode; onPress: () => void };
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'extra', '0', 'back'];
  return (
    <View style={styles.grid} role="group" aria-label="PIN keypad">
      {keys.map((k) => {
        if (k === 'extra' && !extraKey) return <View key={k} style={styles.slot} />;
        const label = k === 'back' ? 'Delete last digit' : k === 'extra' ? extraKey!.label : k;
        return (
          <View key={k} style={styles.slot}>
            <Pressable
              disabled={disabled}
              onPress={() => (k === 'back' ? onBackspace() : k === 'extra' ? extraKey!.onPress() : onDigit(k))}
              accessibilityRole="button"
              accessibilityLabel={label}
              style={({ pressed }) => [styles.key, disabled && { opacity: 0.3 }, pressed && styles.pressed]}>
              {k === 'back' ? (
                <Icon name="backspace" size={24} color={colors.text} strokeWidth={1.6} />
              ) : k === 'extra' ? (
                extraKey!.icon
              ) : (
                <Text style={styles.label}>{k}</Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6, marginHorizontal: -8 },
  slot: { width: '33.333%', paddingHorizontal: 8 },
  key: { height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.surface3, transform: [{ scale: 0.92 }] },
  label: { fontFamily: fonts.expandedMedium, fontSize: 26, color: colors.text, ...tabular },
});
