import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon } from '@/ui/icons';
import { colors, fonts } from '@/ui/theme';

// "October ⌄" in a screen header. Opens the month picker once that exists.
export function MonthChip({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={`Change month, ${label}`} style={({ pressed }) => [styles.chip, pressed && { transform: [{ scale: 0.96 }] }]}>
      <Text style={styles.label}>{label}</Text>
      <Icon name="chevronDown" size={14} color={colors.textFaint} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 44,
    paddingLeft: 16,
    paddingRight: 14,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
});
