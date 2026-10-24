import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PinDots } from '@/components/pin-dots';
import { PinPad } from '@/components/pin-pad';
import { Sheet } from '@/components/sheet';
import { useAccent } from '@/hooks/use-accent';
import { canUseBiometrics, getPin, unlockWithBiometrics } from '@/store/pin';
import { useSettings } from '@/store/settings';
import { useToast } from '@/store/toast';
import { Icon } from '@/ui/icons';
import { colors, fonts } from '@/ui/theme';

// "Amounts are hidden": enter the PIN (or use fingerprint) to show amounts again.
export function UnlockSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const accent = useAccent();
  const fingerprintOn = useSettings((s) => s.fingerprint);
  const setHidden = useSettings((s) => s.setHideAmounts);
  const showToast = useToast((s) => s.show);
  const [pin, setPinValue] = useState<string | null>(null);
  const [entry, setEntry] = useState('');
  const [wrong, setWrong] = useState(false);
  const [shake, setShake] = useState(0);
  const [biometrics, setBiometrics] = useState(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!visible) return;
    setEntry('');
    setWrong(false);
    busy.current = false;
    getPin().then(setPinValue);
    canUseBiometrics().then(setBiometrics);
  }, [visible]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const unlock = () => {
    setHidden(false);
    onClose();
    showToast('Amounts are showing', { label: 'Hide again', onPress: () => setHidden(true) });
  };

  const press = (d: string) => {
    if (busy.current || pin === null || entry.length >= pin.length) return;
    const e = entry + d;
    setEntry(e);
    setWrong(false);
    if (e.length < pin.length) return;
    busy.current = true;
    timer.current = setTimeout(() => {
      if (e === pin) {
        unlock();
        return;
      }
      setWrong(true);
      setShake((n) => n + 1);
      setEntry('');
      busy.current = false;
    }, 180);
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        <View style={styles.head}>
          <View style={[styles.badge, { backgroundColor: `rgba(${accent.rgb},0.16)` }]}>
            <Icon name="lock" size={22} color={accent.lilac} />
          </View>
          <View style={{ gap: 3, flex: 1 }}>
            <Text style={styles.title} role="heading">Amounts are hidden</Text>
            <Text style={[styles.message, wrong && { color: colors.rose }]} role="status">
              {wrong ? "That PIN didn't match. Try again." : 'Enter your PIN to show them.'}
            </Text>
          </View>
        </View>
        <PinDots count={pin?.length ?? 5} filled={entry.length} shake={shake} size={12} />
        <PinPad
          onDigit={press}
          onBackspace={() => !busy.current && setEntry(entry.slice(0, -1))}
          extraKey={
            fingerprintOn && biometrics
              ? {
                  label: 'Use fingerprint',
                  icon: <Icon name="fingerprint" size={26} color={accent.lilac} />,
                  onPress: () => unlockWithBiometrics().then((ok) => ok && unlock()),
                }
              : undefined
          }
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 24, paddingHorizontal: 8, paddingBottom: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.expandedSemibold, fontSize: 19, color: colors.text },
  message: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
});
