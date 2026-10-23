import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Entry } from '@/data/seed';
import { groupIndian } from '@/ui/format';
import { Icon, type IconName } from '@/ui/icons';
import { colors, fonts, layout, radius, space, tabular, type } from '@/ui/theme';

// Pieces shared by New entry and Edit entry.

const MAX_DIGITS = 7;
const TAB_WIDTH = 96;
const nativeDriver = Platform.OS !== 'web';

// Keypad rule: leading zeros dropped, at most 7 digits. Returns null when the key is ignored.
export function appendDigits(current: string, digits: string): string | null {
  const next = current === '' || current === '0' ? digits.replace(/^0+/, '') : current + digits;
  return next.length > MAX_DIGITS ? null : next;
}

export function FormHeader({ title, closeLabel = 'Close', onClose, right }: { title: string; closeLabel?: string; onClose: () => void; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={onClose} accessibilityLabel={closeLabel} style={({ pressed }) => [styles.iconButton, pressed && { transform: [{ scale: 0.94 }] }]}>
          <Icon name="close" size={18} color={colors.text} strokeWidth={1.9} />
        </Pressable>
        <Text style={styles.title} role="heading">{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function TypeTabs({ value, onChange }: { value: Entry['type']; onChange: (t: Entry['type']) => void }) {
  const x = useRef(new Animated.Value(value === 'income' ? TAB_WIDTH : 0)).current;

  useEffect(() => {
    Animated.timing(x, {
      toValue: value === 'income' ? TAB_WIDTH : 0,
      duration: 280,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: nativeDriver,
    }).start();
  }, [value, x]);

  return (
    <View style={styles.tabs} role="tablist" aria-label="Type">
      {(['expense', 'income'] as const).map((t) => (
        <Pressable key={t} onPress={() => onChange(t)} role="tab" aria-selected={value === t} style={styles.tab}>
          <Text style={[styles.tabLabel, value === t && { color: colors.text }]}>{t === 'expense' ? 'Expense' : 'Income'}</Text>
        </Pressable>
      ))}
      <Animated.View style={[styles.indicator, { transform: [{ translateX: x }] }]} />
    </View>
  );
}

// The big amount with a blinking caret; bumps on every key press. `note` sits underneath ("Was ₹486").
export function AmountDisplay({ digits, note }: { digits: string; note?: string }) {
  const value = digits === '' ? 0 : parseInt(digits, 10);
  const bump = useRef(new Animated.Value(1)).current;
  const caret = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    bump.setValue(1.045);
    Animated.timing(bump, { toValue: 1, duration: 180, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: nativeDriver }).start();
  }, [digits, bump]);

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(caret, { toValue: 0, duration: 0, delay: 550, useNativeDriver: nativeDriver }),
        Animated.timing(caret, { toValue: 1, duration: 0, delay: 550, useNativeDriver: nativeDriver }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [caret]);

  return (
    <View style={styles.amountArea}>
      <Text style={styles.amountLabel}>Amount</Text>
      <Animated.View style={[styles.amountRow, { transform: [{ scale: bump }] }]}>
        <Text style={styles.rupee}>₹</Text>
        <Text style={[styles.amount, value === 0 && { color: colors.textDisabled }]} aria-live="polite">
          {groupIndian(value)}
        </Text>
        <Animated.View style={[styles.caret, { opacity: caret }]} />
      </Animated.View>
      {note !== undefined && <Text style={styles.note}>{note}</Text>}
    </View>
  );
}

export function DetailsCard({ children }: { children: ReactNode }) {
  return <View style={styles.details}>{children}</View>;
}

export function DetailDivider() {
  return <View style={styles.divider} />;
}

// A tappable row in the details card: icon, text, and a trailing meta or chevron.
export function DetailRow({
  icon,
  text,
  placeholder,
  meta,
  chevron,
  onPress,
  accessibilityLabel,
}: {
  icon: IconName;
  text: string;
  placeholder?: boolean;
  meta?: string;
  chevron?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} style={({ pressed }) => [styles.detailRow, pressed && styles.detailPressed]}>
      <Icon name={icon} size={18} color={colors.textFaint} />
      <Text style={[styles.detailText, placeholder && { color: colors.textFaint }]} numberOfLines={1}>{text}</Text>
      {meta && <Text style={styles.detailMeta}>{meta}</Text>}
      {chevron && <Icon name="chevronRight" size={16} color={colors.textFaint} strokeWidth={2} />}
    </Pressable>
  );
}

export const formStyles = StyleSheet.create({
  detailRow: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16 },
  detailText: { flex: 1, minWidth: 0, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  footer: { paddingTop: 10, paddingHorizontal: space.screenX, paddingBottom: space.xxl, gap: space.sm },
  hint: { textAlign: 'center', fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  link: { fontFamily: fonts.medium, fontSize: 14, color: colors.lilac },
});

const styles = StyleSheet.create({
  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.pageTitle, color: colors.text },
  tabs: { flexDirection: 'row', paddingHorizontal: space.screenX, borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { width: TAB_WIDTH, height: 44, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.textFaint },
  indicator: {
    position: 'absolute',
    left: space.screenX,
    bottom: -1,
    width: TAB_WIDTH,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.iris,
  },
  amountArea: { flex: 1, minHeight: 140, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  amountLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rupee: { fontFamily: fonts.expandedMedium, fontSize: 34, color: colors.textFaint, alignSelf: 'flex-start', marginTop: 6 },
  amount: { ...type.amountXL, ...tabular, lineHeight: 68, color: colors.text },
  caret: { width: 3, height: 56, borderRadius: 2, backgroundColor: colors.iris, marginLeft: 2 },
  note: { height: 20, fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint, ...tabular },
  details: { marginTop: 14, marginHorizontal: space.screenX, borderRadius: radius.card, backgroundColor: colors.surface1, overflow: 'hidden' },
  detailRow: formStyles.detailRow,
  detailPressed: { backgroundColor: colors.surface2 },
  detailText: formStyles.detailText,
  detailMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  divider: { height: 1, backgroundColor: colors.line },
});
