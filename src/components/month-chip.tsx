import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { MonthPickerSheet } from '@/components/month-picker-sheet';
import { useViewDay } from '@/store/view-month';
import { monthName } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts } from '@/ui/theme';

// "October ⌄" in a screen header. Shows the shared month and opens the month picker.
export function MonthChip() {
  const viewDay = useViewDay();
  const [open, setOpen] = useState(false);
  const label = monthName(viewDay);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel={`Change month, ${label} ${viewDay.slice(0, 4)}`}
        style={({ pressed }) => [styles.chip, pressed && { transform: [{ scale: 0.96 }] }]}>
        <Text style={styles.label}>{label}</Text>
        <Icon name="chevronDown" size={14} color={colors.textFaint} strokeWidth={2} />
      </Pressable>
      <MonthPickerSheet visible={open} onClose={() => setOpen(false)} />
    </>
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
