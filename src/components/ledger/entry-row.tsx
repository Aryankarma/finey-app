import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Amount } from '@/components/amount';
import type { Entry } from '@/data/seed';
import { useAccent } from '@/hooks/use-accent';
import { signedAmount } from '@/store/ledger';
import { categories } from '@/ui/categories';
import { formatMoney } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, layout, space } from '@/ui/theme';

const DELETE_WIDTH = 76;
const nativeDriver = Platform.OS !== 'web';

type Props = {
  entry: Entry;
  subtitle?: string; // defaults to the category
  onPress: () => void;
  // Swipe left to reveal Delete. Leave out onDelete for a plain row.
  onDelete?: () => void;
  swipeOpen?: boolean;
  onSwipeChange?: (open: boolean) => void;
};

export function EntryRow({ entry, subtitle, onPress, onDelete, swipeOpen = false, onSwipeChange }: Props) {
  const accent = useAccent();
  const x = useRef(new Animated.Value(0)).current;
  const resting = useRef(0);

  const snap = (to: number) => {
    resting.current = to;
    Animated.timing(x, { toValue: to, duration: 300, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: nativeDriver }).start();
  };

  useEffect(() => {
    snap(swipeOpen ? -DELETE_WIDTH : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swipeOpen]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        // Capture phase, so a horizontal drag wins over the row's own press handling.
        onMoveShouldSetPanResponderCapture: (_, g) => !!onDelete && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => x.setValue(Math.max(-DELETE_WIDTH - 24, Math.min(0, resting.current + g.dx))),
        onPanResponderRelease: (_, g) => {
          const open = resting.current + g.dx < -DELETE_WIDTH / 2;
          snap(open ? -DELETE_WIDTH : 0);
          onSwipeChange?.(open);
        },
        onPanResponderTerminate: () => snap(resting.current),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onDelete, onSwipeChange],
  );

  const category = categories[entry.category];
  const income = entry.type === 'income';

  return (
    <View style={styles.wrap}>
      {onDelete && (
        <Pressable onPress={onDelete} style={styles.delete} accessibilityLabel={`Delete ${entry.name}`}>
          <Icon name="trash" size={18} color={colors.rose} />
          <Text style={styles.deleteLabel}>Delete</Text>
        </Pressable>
      )}
      <Animated.View style={[styles.slider, { transform: [{ translateX: x }] }]} {...pan.panHandlers}>
        <Pressable
          onPress={() => (swipeOpen ? onSwipeChange?.(false) : onPress())}
          accessibilityRole="button"
          accessibilityHint={onDelete ? 'Swipe left to delete' : undefined}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface1 }]}>
          <View style={styles.glyph}>
            <Icon name={category.icon} size={18} color={category.color} />
          </View>
          <View style={styles.middle}>
            <View style={styles.nameLine}>
              <Text style={styles.name} numberOfLines={1}>{entry.name}</Text>
              {entry.saved && <Icon name="bookmark" size={12} color={accent.lilac} fill={accent.lilac} strokeWidth={0} />}
            </View>
            <Text style={styles.sub} numberOfLines={1}>{subtitle ?? category.label}</Text>
          </View>
          <Amount style={[styles.amount, income && { color: colors.mint }]}>{formatMoney(signedAmount(entry), { signed: true })}</Amount>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Bleeds to the screen edges so the Delete button sits flush right.
  wrap: { height: layout.rowHeight, marginHorizontal: -space.screenX, overflow: 'hidden' },
  delete: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    backgroundColor: colors.roseTint,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.rose },
  slider: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.screenX },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14 },
  glyph: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, minWidth: 0, gap: 2 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  amount: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
});
