import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/ui/icons';
import { colors, fonts, gradients, motion } from '@/ui/theme';

// Free-text capture field with buttons for the full form and voice entry.
// Typing a line and pressing enter hands it to `onSubmit` (Paste text reads it).
export function QuickAdd({ onOpenForm, onVoice, onSubmit }: { onOpenForm?: () => void; onVoice?: () => void; onSubmit?: (text: string) => void }) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState('');

  return (
    <View style={[styles.bar, focused && styles.barFocused]}>
      <TextInput
        value={text}
        onChangeText={setText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="done"
        onSubmitEditing={() => {
          if (!text.trim()) return;
          onSubmit?.(text.trim());
          setText('');
        }}
        placeholder="Spent 450 on groceries yesterday"
        placeholderTextColor={colors.textFaint}
        accessibilityLabel="Describe what you spent or earned"
        style={styles.input}
      />
      <Pressable
        onPress={onOpenForm}
        accessibilityRole="button"
        accessibilityLabel="Open the full form"
        style={({ pressed }) => [styles.round, styles.keypad, pressed && styles.pressed]}>
        <Icon name="keypad" color={colors.text} />
      </Pressable>
      <Pressable
        onPress={onVoice}
        accessibilityRole="button"
        accessibilityLabel="Speak an entry"
        style={({ pressed }) => pressed && styles.pressed}>
        <LinearGradient colors={gradients.primary} style={[styles.round, styles.gradient]}>
          <Icon name="mic" color={colors.textOnAccent} strokeWidth={1.9} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginTop: 16,
    marginHorizontal: 20,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 20,
    paddingRight: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  barFocused: { backgroundColor: '#19191D', borderColor: 'rgba(123,108,246,0.65)' },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    ...Platform.select<object>({ web: { outlineStyle: 'none' }, default: {} }),
  },
  round: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  keypad: { backgroundColor: colors.surface4 },
  gradient: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  pressed: { transform: [{ scale: motion.pressScale - 0.02 }] },
});
