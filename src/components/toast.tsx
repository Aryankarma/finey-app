import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text } from 'react-native';

import { useToast } from '@/store/toast';
import { colors, fonts, radius } from '@/ui/theme';

// Renders the current toast from useToast, `bottom` points above the tab bar.
export function Toast({ bottom }: { bottom: number }) {
  const toast = useToast((s) => s.toast);
  const hide = useToast((s) => s.hide);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [toast, enter]);

  if (!toast) return null;

  return (
    <Animated.View
      role="status"
      style={[
        styles.toast,
        { bottom, opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
      ]}>
      <Text style={styles.message} numberOfLines={1}>{toast.message}</Text>
      {toast.actionLabel && (
        <Pressable
          onPress={() => {
            toast.onAction?.();
            hide();
          }}
          style={styles.action}>
          <Text style={styles.actionLabel}>{toast.actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 56,
    borderRadius: radius.toast,
    backgroundColor: colors.surface4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  message: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  action: { height: 40, paddingHorizontal: 14, borderRadius: 20, justifyContent: 'center' },
  actionLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.lilac },
});
