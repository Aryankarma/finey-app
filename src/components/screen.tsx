import type { ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme';

// Space above every header. On a phone this is exactly the status bar (the safe-area inset),
// as native apps do. The web build has no status bar, so it stands in a standard 24dp Android one.
const WEB_STATUS_BAR = 24;

// Root view for every screen: background, top space and, for screens without the tab bar, the bottom inset.
export function Screen({ children, bottom = false, style }: { children: ReactNode; bottom?: boolean; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: Platform.OS === 'web' ? WEB_STATUS_BAR : insets.top,
          paddingBottom: bottom ? insets.bottom : 0,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
