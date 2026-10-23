import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DrawnCheck } from '@/components/drawn-check';
import { PrimaryButton } from '@/components/primary-button';
import { Sheet } from '@/components/sheet';
import { colors, fonts } from '@/ui/theme';

// Success sheet with a drawn check, e.g. "Recorded" after New entry or "Changes saved" after Edit entry.
export function ResultSheet({
  visible,
  title,
  secondaryLabel,
  message,
  onSecondary,
  onDone,
}: {
  visible: boolean;
  title: string;
  secondaryLabel: string;
  message: string;
  onSecondary: () => void;
  onDone: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onDone}>
      <View style={styles.body} role="status">
        <DrawnCheck />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <Pressable onPress={onSecondary} style={({ pressed }) => [styles.again, pressed && { transform: [{ scale: 0.98 }] }]}>
            <Text style={styles.againLabel}>{secondaryLabel}</Text>
          </Pressable>
          <PrimaryButton label="Done" onPress={onDone} height={54} style={{ flex: 1 }} />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: 12, paddingTop: 14, paddingHorizontal: 4 },
  title: { fontFamily: fonts.expandedSemibold, fontSize: 22, color: colors.text, marginTop: 8 },
  message: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  again: { flex: 1, height: 54, borderRadius: 27, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  againLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
});
