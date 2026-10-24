import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useAccent } from '@/hooks/use-accent';
import { Icon, type IconName } from '@/ui/icons';
import { colors, layout, type } from '@/ui/theme';

// The full-width accent button. Disabled keeps it visible but faded, as on the boards.
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  height = layout.buttonHeight,
  icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  height?: number;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const accent = useAccent();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      aria-disabled={disabled}
      style={({ pressed }) => [style, { opacity: disabled ? 0.38 : 1 }, pressed && !disabled && styles.pressed]}>
      <LinearGradient colors={accent.primary} style={[styles.fill, { height, borderRadius: height / 2 }]}>
        {icon && <Icon name={icon} size={18} color={colors.textOnAccent} />}
        <Text style={[styles.label, height < layout.buttonHeight && { fontSize: 15 }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  label: { ...type.button, color: colors.textOnAccent },
  pressed: { transform: [{ scale: 0.98 }] },
});
