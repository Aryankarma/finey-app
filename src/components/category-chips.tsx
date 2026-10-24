import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CategoryKey } from '@/data/seed';
import { useAccent } from '@/hooks/use-accent';
import { categories } from '@/ui/categories';
import { Icon } from '@/ui/icons';
import { colors, fonts } from '@/ui/theme';

// One-line, side-scrolling row of category chips; works as a radio group.
export function CategoryChips({
  options,
  value,
  onChange,
}: {
  options: CategoryKey[];
  value: CategoryKey | null;
  onChange: (key: CategoryKey) => void;
}) {
  const accent = useAccent();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
      role="radiogroup"
      aria-label="Category">
      {options.map((key) => {
        const on = key === value;
        const c = categories[key];
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            role="radio"
            aria-checked={on}
            style={({ pressed }) => [styles.chip, on && { backgroundColor: accent.irisTint, borderColor: accent.iris }, pressed && styles.pressed]}>
            <View style={styles.glyph}>
              <Icon name={c.icon} size={16} color={c.color} strokeWidth={1.9} />
            </View>
            <Text style={[styles.label, on && { color: colors.text }]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: { flexGrow: 0, flexShrink: 0 },
  row: { gap: 8, paddingHorizontal: 20 },
  chip: {
    height: 44,
    paddingLeft: 6,
    paddingRight: 16,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pressed: { transform: [{ scale: 0.96 }] },
  glyph: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1C1C21', alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.medium, fontSize: 14, color: '#D9D9DE' },
});
