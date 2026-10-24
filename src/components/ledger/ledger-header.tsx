import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ViewTabs } from '@/components/view-tabs';
import { useAccent } from '@/hooks/use-accent';
import { Icon, type IconName } from '@/ui/icons';
import { colors, layout, space, type } from '@/ui/theme';

// Title, actions and the List / Calendar tabs shared by both Ledger views.
export function LedgerHeader({ view, action }: { view: 'list' | 'calendar'; action: { icon: IconName; label: string; onPress?: () => void } }) {
  const router = useRouter();
  const accent = useAccent();

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title} role="heading">Ledger</Text>
        <View style={styles.actions}>
          <Pressable onPress={action.onPress} accessibilityLabel={action.label} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Icon name={action.icon} size={18} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => router.push('/entry/new')} accessibilityLabel="Add an entry" style={({ pressed }) => pressed && styles.pressed}>
            <LinearGradient colors={accent.primary} style={[styles.iconButton, styles.add]}>
              <Icon name="plus" size={20} color={colors.textOnAccent} strokeWidth={2.2} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <ViewTabs
        label="Ledger view"
        tabs={[
          { key: 'list', label: 'List' },
          { key: 'calendar', label: 'Calendar' },
        ]}
        value={view}
        onChange={(v) => router.replace(v === 'list' ? '/ledger' : '/ledger/calendar')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
  },
  title: { ...type.screenTitle, color: colors.text },
  actions: { flexDirection: 'row', gap: space.sm },
  iconButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  pressed: { transform: [{ scale: 0.94 }] },
});
