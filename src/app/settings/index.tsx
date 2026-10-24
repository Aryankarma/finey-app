import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { ExportSheet } from '@/components/export-sheet';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { SwitchMark } from '@/components/switch';
import { useSettings, type AccentKey, type ThemeChoice } from '@/store/settings';
import { Icon, type IconName } from '@/ui/icons';
import { fonts, layout, space, type } from '@/ui/theme';

const ACCENTS: { key: AccentKey; name: string; color: string; text: string; soft: string }[] = [
  { key: 'iris', name: 'Iris', color: '#7B6CF6', text: '#5240D9', soft: '#A59BFF' },
  { key: 'blue', name: 'Blue', color: '#4F8CF7', text: '#2F6FDB', soft: '#8FB6FF' },
  { key: 'teal', name: 'Teal', color: '#22B8B0', text: '#148A84', soft: '#6FDCD5' },
  { key: 'amber', name: 'Amber', color: '#E39A2D', text: '#B5700F', soft: '#F2C27A' },
];

// Settings has its own palette so choosing Light previews it right here (the rest of the app stays dark).
const PALETTES = {
  dark: { bg: '#08080A', sf: '#111114', sf2: '#1A1A1F', tx: '#F4F4F6', tx2: '#A6A6B0', tx3: '#8A8A95', dv: '#1C1C21', off: '#26262D', knobOff: '#8A8A95', thumb: '#2C2C34' },
  light: { bg: '#F4F4F7', sf: '#FFFFFF', sf2: '#EDEDF2', tx: '#121216', tx2: '#55555F', tx3: '#73737E', dv: '#E8E8EE', off: '#D5D5DD', knobOff: '#FFFFFF', thumb: '#FFFFFF' },
};
type Palette = (typeof PALETTES)['dark'];

const THEME_NOTES: Record<ThemeChoice, (scheme: string) => string> = {
  system: (scheme) => `Follows your phone. It is ${scheme} right now.`,
  dark: () => 'Easy on the eyes at night and saves battery on most phones.',
  light: () => 'Best in bright light. This screen shows a preview of it.',
};

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettings();
  const phone = useColorScheme() === 'light' ? 'light' : 'dark';
  const [exportOpen, setExportOpen] = useState(false);

  const light = settings.theme === 'light' || (settings.theme === 'system' && phone === 'light');
  const t = light ? PALETTES.light : PALETTES.dark;
  const accent = ACCENTS.find((a) => a.key === settings.accent) ?? ACCENTS[0];
  const accentText = light ? accent.text : accent.soft;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen style={{ backgroundColor: t.bg }}>
      <View style={styles.header}>
        <Pressable onPress={back} accessibilityLabel="Back to Home" style={({ pressed }) => [styles.iconButton, { backgroundColor: t.sf2 }, pressed && { transform: [{ scale: 0.94 }] }]}>
          <Icon name="back" size={18} color={t.tx} strokeWidth={1.9} />
        </Pressable>
        <Text style={[styles.title, { color: t.tx }]} role="heading">Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Privacy" t={t}>
          <Row
            t={t}
            icon="eyeOff"
            accent={accentText}
            title="Hide amounts when Finey opens"
            sub={settings.hideOnOpen ? 'Tap the eye on Home and enter your PIN to show them' : 'Amounts show as soon as you open Finey'}
            onPress={() => settings.set({ hideOnOpen: !settings.hideOnOpen })}
            switchOn={settings.hideOnOpen}
            switchColor={accent.color}
          />
          <Row
            t={t}
            divider
            icon="fingerprintAlt"
            accent={accentText}
            title="Unlock with fingerprint"
            sub={settings.fingerprint ? 'Use your fingerprint instead of typing the PIN' : 'You will type your PIN every time'}
            onPress={() => settings.set({ fingerprint: !settings.fingerprint })}
            switchOn={settings.fingerprint}
            switchColor={accent.color}
          />
          <Row
            t={t}
            divider
            icon="lockKeyhole"
            accent={accentText}
            title="Change privacy PIN"
            sub="Asked before amounts are shown"
            onPress={() => router.push('/settings/pin')}
            chevron
          />
        </Section>

        <Section title="Appearance" t={t}>
          <View style={{ padding: 16 }}>
            <Text style={[styles.rowTitle, { color: t.tx, marginBottom: 12 }]}>Theme</Text>
            <Segmented
              label="Theme"
              options={[
                { key: 'system', label: 'System' },
                { key: 'dark', label: 'Dark' },
                { key: 'light', label: 'Light' },
              ]}
              value={settings.theme}
              onChange={(theme) => settings.set({ theme })}
              background={t.sf2}
              thumbColor={t.thumb}
              textColor={t.tx2}
              textOnColor={t.tx}
            />
            <Text style={[styles.note, { color: t.tx3 }]}>{THEME_NOTES[settings.theme](phone)}</Text>
            <View style={[styles.innerDivider, { backgroundColor: t.dv }]} />
            <Text style={[styles.rowTitle, { color: t.tx }]}>Accent colour</Text>
            <View style={styles.swatches} role="radiogroup" aria-label="Accent colour">
              {ACCENTS.map((a) => {
                const on = a.key === settings.accent;
                return (
                  <Pressable
                    key={a.key}
                    role="radio"
                    aria-checked={on}
                    accessibilityLabel={a.name}
                    onPress={() => settings.set({ accent: a.key })}
                    style={({ pressed }) => [styles.swatchRing, on && { borderColor: a.color }, pressed && { transform: [{ scale: 0.9 }] }]}>
                    <View style={[styles.swatch, { backgroundColor: a.color }]}>{on && <Icon name="check" size={18} color="#FFFFFF" strokeWidth={2.4} />}</View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Section>

        <Section title="Data" t={t}>
          <Row t={t} icon="rupee" accent={accentText} title="Currency" sub="Indian rupee, amounts like ₹1,24,500" />
          <Row t={t} divider icon="download" accent={accentText} title="Export your data" sub="Download a month as a CSV file" onPress={() => setExportOpen(true)} chevron />
        </Section>

        <Section title="About" t={t}>
          <Row t={t} icon="info" accent={accentText} title="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
        </Section>
        <Text style={[styles.footnote, { color: t.tx3 }]}>Your entries stay on this phone. Finey has no account to sign in to.</Text>
      </ScrollView>

      <ExportSheet visible={exportOpen} onClose={() => setExportOpen(false)} />
    </Screen>
  );
}

function Section({ title, t, children }: { title: string; t: Palette; children: ReactNode }) {
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: t.tx3 }]}>{title}</Text>
      <View style={[styles.group, { backgroundColor: t.sf }]}>{children}</View>
    </View>
  );
}

function Row({
  t,
  icon,
  accent,
  title,
  sub,
  value,
  divider,
  chevron,
  onPress,
  switchOn,
  switchColor,
}: {
  t: Palette;
  icon: IconName | 'rupee';
  accent: string;
  title: string;
  sub?: string;
  value?: string;
  divider?: boolean;
  chevron?: boolean;
  onPress?: () => void;
  switchOn?: boolean;
  switchColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      role={switchOn !== undefined ? 'switch' : undefined}
      aria-checked={switchOn}
      style={({ pressed }) => [styles.row, divider && { borderTopWidth: 1, borderTopColor: t.dv }, pressed && { backgroundColor: 'rgba(128,128,140,0.08)' }]}>
      <View style={[styles.rowIcon, { backgroundColor: t.sf2 }]}>
        {icon === 'rupee' ? <Text style={[styles.rupee, { color: accent }]}>₹</Text> : <Icon name={icon} size={18} color={accent} />}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.rowTitle, { color: t.tx }]}>{title}</Text>
        {sub && <Text style={[styles.rowSub, { color: t.tx3 }]}>{sub}</Text>}
      </View>
      {value && <Text style={[styles.value, { color: t.tx2 }]}>{value}</Text>}
      {switchOn !== undefined && <SwitchMark on={switchOn} onColor={switchColor} offColor={t.off} knobOffColor={t.knobOff} />}
      {chevron && <Icon name="chevronRight" size={16} color={t.tx3} strokeWidth={2} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { height: layout.headerHeight, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: space.screenX },
  iconButton: { width: layout.iconButton, height: layout.iconButton, borderRadius: layout.iconButton / 2, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.expandedSemibold, fontSize: 22 },
  content: { paddingTop: 12, paddingHorizontal: space.screenX, paddingBottom: 32, gap: 22 },
  sectionTitle: { marginHorizontal: 4, marginBottom: 8, fontFamily: fonts.semibold, fontSize: 13 },
  group: { borderRadius: 20, overflow: 'hidden' },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 16 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rupee: { fontFamily: fonts.semibold, fontSize: 16 },
  rowTitle: { ...type.body },
  rowSub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  value: { fontFamily: fonts.regular, fontSize: 15 },
  note: { marginTop: 10, marginHorizontal: 2, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  innerDivider: { height: 1, marginVertical: 16, marginHorizontal: -16 },
  swatches: { flexDirection: 'row', gap: 12, marginTop: 12 },
  swatchRing: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  footnote: { marginTop: -8, marginHorizontal: 4, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
});
