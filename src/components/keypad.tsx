import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/ui/icons';
import { colors, layout, tabular, type } from '@/ui/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'] as const;

// The in-app number pad used instead of the system keyboard.
// `compact` is the smaller pad used inside sheets (Record a payment).
export function Keypad({ onKey, onBackspace, compact = false }: { onKey: (digits: string) => void; onBackspace: () => void; compact?: boolean }) {
  const height = compact ? 52 : layout.keypadKey;
  return (
    <View style={[styles.grid, compact && styles.gridCompact]} role="group" aria-label="Amount keypad">
      {KEYS.map((key) => (
        <Pressable
          key={key}
          onPress={() => (key === 'back' ? onBackspace() : onKey(key))}
          accessibilityRole="button"
          accessibilityLabel={key === 'back' ? 'Delete last digit' : key === '00' ? 'Double zero' : key}
          style={({ pressed }) => [styles.key, { height, borderRadius: height / 2 }, pressed && (compact ? styles.pressedCompact : styles.pressed)]}>
          {key === 'back' ? (
            <Icon name="backspace" size={compact ? 22 : 24} color={colors.text} strokeWidth={1.6} />
          ) : (
            <Text style={[styles.label, compact && { fontSize: 22 }, key === '00' && { fontSize: compact ? 18 : 20 }]}>{key}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4, columnGap: 12, paddingTop: 12, paddingHorizontal: 28 },
  gridCompact: { rowGap: 2, paddingTop: 0, paddingHorizontal: 12 },
  key: { width: '30.5%', flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.surface2, transform: [{ scale: 0.94 }] },
  pressedCompact: { backgroundColor: colors.surface3, transform: [{ scale: 0.94 }] },
  label: { ...type.keypad, ...tabular, color: colors.text },
});
