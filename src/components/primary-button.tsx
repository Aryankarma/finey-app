import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, gradients, layout, type } from '@/ui/theme';

// The full-width purple button. Disabled keeps it visible but faded, as on the boards.
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  height = layout.buttonHeight,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      aria-disabled={disabled}
      style={({ pressed }) => [style, { opacity: disabled ? 0.38 : 1 }, pressed && !disabled && styles.pressed]}>
      <LinearGradient colors={gradients.primary} style={[styles.fill, { height, borderRadius: height / 2 }]}>
        <Text style={[styles.label, height < layout.buttonHeight && { fontSize: 15 }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  label: { ...type.button, color: colors.textOnAccent },
  pressed: { transform: [{ scale: 0.98 }] },
});
