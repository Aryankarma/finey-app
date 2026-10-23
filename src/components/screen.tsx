import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme';

// The boards leave 36px above every header for the status bar. Use the device's own
// inset when it's bigger, and never less than this, so the web build isn't flush to the top.
const MIN_TOP = 36;

// Root view for every screen: background, top space and, for screens without the tab bar, the bottom inset.
export function Screen({ children, bottom = false, style }: { children: ReactNode; bottom?: boolean; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg, paddingTop: Math.max(insets.top, MIN_TOP), paddingBottom: bottom ? insets.bottom : 0 }, style]}>
      {children}
    </View>
  );
}
