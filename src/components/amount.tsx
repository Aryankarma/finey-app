import { Platform, Text, type TextProps } from 'react-native';

import { useSettings } from '@/store/settings';
import { tabular } from '@/ui/theme';

// A money figure that blurs when amounts are hidden. iOS has no text blur, so it masks the digits instead.
const blur = Platform.select<object>({
  web: { filter: 'blur(9px)', userSelect: 'none' },
  android: { filter: [{ blur: 9 }] },
  default: {},
});

export function Amount({ children, style, ...rest }: TextProps & { children: string }) {
  const hidden = useSettings((s) => s.hideAmounts);
  const masked = hidden && Platform.OS === 'ios';
  return (
    <Text {...rest} style={[tabular, style, hidden && blur]} accessibilityLabel={hidden ? 'Hidden amount' : undefined}>
      {masked ? children.replace(/[\d,]/g, '•') : children}
    </Text>
  );
}
